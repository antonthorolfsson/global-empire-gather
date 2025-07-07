import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import GameMap from './GameMap';
import EmpireStats from './EmpireStats';
import ColorPickerDialog from './ColorPickerDialog';
import WarDeclaration from './WarDeclaration';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GAME_COUNTRIES } from '@/data/gameCountries';
import { ArrowLeft, Play, Users, Crown } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface GamePlayer {
  id: string;
  user_id: string;
  player_name: string;
  color: string;
  player_order: number;
  is_host: boolean;
}

interface Profile {
  display_name: string;
}

interface Game {
  id: string;
  name: string;
  status: string;
  game_phase: string;
  current_player_turn: number;
  created_by: string;
}

interface GameCountry {
  country_id: string;
  player_id: string;
}

const MultiplayerGame = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [gameCountries, setGameCountries] = useState<GameCountry[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<GamePlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayerInGame, setIsPlayerInGame] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    
    loadGameData();
    const cleanup = setupRealtimeSubscriptions();
    
    return cleanup;
  }, [gameId, user]);

  const loadGameData = async () => {
    try {
      // Load game info
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;
      console.log('Loaded game data:', gameData);
      setGame(gameData);

      // Load players
      const { data: playersData, error: playersError } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId)
        .order('player_order');

      if (playersError) throw playersError;
      console.log('Loaded players data:', playersData);
      setPlayers(playersData || []);

      // Check if current user is in this game
      const userPlayer = playersData?.find(p => p.user_id === user?.id);
      setIsPlayerInGame(!!userPlayer);
      if (userPlayer) {
        console.log('Current player:', userPlayer);
        setCurrentPlayer(userPlayer);
      }

      // Load country selections
      const { data: countriesData, error: countriesError } = await supabase
        .from('game_countries')
        .select('*')
        .eq('game_id', gameId);

      if (countriesError) throw countriesError;
      console.log('Loaded countries data:', countriesData);
      setGameCountries(countriesData || []);

    } catch (error: any) {
      toast({
        title: "Error loading game",
        description: error.message,
        variant: "destructive",
      });
      navigate('/lobby');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to game updates
    const gameChannel = supabase
      .channel(`game-${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_players',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        console.log('Game players updated:', payload);
        loadGameData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_countries',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        console.log('Game countries updated:', payload);
        loadGameData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        console.log('Game updated:', payload);
        loadGameData();
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(gameChannel);
    };
  };

  const joinGame = async () => {
    if (players.length >= 8) {
      toast({
        title: "Game is full",
        description: "This game already has the maximum number of players.",
        variant: "destructive",
      });
      return;
    }
    
    setShowColorPicker(true);
  };

  const handleColorSelect = async (selectedColor: string) => {
    try {
      const nextOrder = players.length;

      const { error } = await supabase
        .from('game_players')
        .insert({
          game_id: gameId,
          user_id: user?.id,
          player_name: user?.user_metadata?.display_name || user?.email || 'Player',
          color: selectedColor,
          player_order: nextOrder,
          is_host: false
        });

      if (error) throw error;

      setShowColorPicker(false);
      toast({
        title: "Joined game!",
        description: "You've successfully joined the game.",
      });
    } catch (error: any) {
      toast({
        title: "Error joining game",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleColorPickerCancel = () => {
    setShowColorPicker(false);
  };

  const startGame = async () => {
    if (!currentPlayer?.is_host) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'active',
          game_phase: 'playing'
        })
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: "Game started!",
        description: "The conquest begins! Select countries to expand your empire.",
      });
    } catch (error: any) {
      toast({
        title: "Error starting game",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const endVotingPhase = async () => {
    if (!currentPlayer?.is_host) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          game_phase: 'battle'
        })
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: "Voting phase ended!",
        description: "Moving to the next phase of the game.",
      });
    } catch (error: any) {
      toast({
        title: "Error ending voting phase",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const selectCountry = async (countryId: string) => {
    console.log('Selecting country:', countryId, 'Current player:', currentPlayer, 'Game status:', game?.status);
    
    if (!isPlayerInGame || !currentPlayer || game?.status !== 'active') {
      console.log('Cannot select country:', { isPlayerInGame, hasCurrentPlayer: !!currentPlayer, gameStatus: game?.status });
      return;
    }

    // Check if it's this player's turn
    if (game.current_player_turn !== currentPlayer.player_order) {
      const currentTurnPlayer = players.find(p => p.player_order === game.current_player_turn);
      console.log('Not your turn! Current turn belongs to:', currentTurnPlayer?.player_name);
      toast({
        title: "Not your turn",
        description: `Wait for ${currentTurnPlayer?.player_name || 'another player'} to make their move.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if country is already selected
      const existingSelection = gameCountries.find(gc => gc.country_id === countryId);
      if (existingSelection) {
        console.log('Country already selected by player:', existingSelection.player_id);
        toast({
          title: "Country already selected",
          description: "This country has already been claimed.",
          variant: "destructive",
        });
        return;
      }

      console.log('Inserting country selection:', { gameId, countryId, playerId: currentPlayer.id });

      // Insert the country selection and advance the turn
      const { error: countryError } = await supabase
        .from('game_countries')
        .insert({
          game_id: gameId,
          country_id: countryId,
          player_id: currentPlayer.id
        });

      if (countryError) {
        console.error('Error inserting country:', countryError);
        throw countryError;
      }

      // Advance to next player's turn
      const nextPlayerTurn = (game.current_player_turn + 1) % players.length;
      console.log('=== TURN ADVANCEMENT DEBUG ===');
      console.log('Current turn:', game.current_player_turn);
      console.log('Total players:', players.length);
      console.log('Players array:', players.map(p => ({ order: p.player_order, name: p.player_name })));
      console.log('Next turn calculated:', nextPlayerTurn);
      console.log('===============================');
      
      const { error: gameError } = await supabase
        .from('games')
        .update({ current_player_turn: nextPlayerTurn })
        .eq('id', gameId);

      if (gameError) {
        console.error('Error updating turn:', gameError);
        throw gameError;
      }

      console.log('Country selected successfully! Next turn:', nextPlayerTurn);
      toast({
        title: "Country selected!",
        description: `You've claimed ${countryId}!`,
      });
    } catch (error: any) {
      console.error('selectCountry error:', error);
      toast({
        title: "Error selecting country",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean to-primary flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean to-primary flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg mb-4">Game not found</p>
          <Button onClick={() => navigate('/lobby')}>Back to Lobby</Button>
        </Card>
      </div>
    );
  }

  // If user is not in the game and game is waiting, show join option
  if (!isPlayerInGame && game.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean to-primary p-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="outline" onClick={() => navigate('/lobby')} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Lobby
          </Button>
          
          <Card className="p-8 text-center bg-card/95 backdrop-blur-sm">
            <h1 className="text-3xl font-bold mb-4">{game.name}</h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
              <Users className="w-5 h-5" />
              <span>{players.length}/8 players</span>
            </div>
            
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold">Players in this game:</h3>
              <div className="grid gap-2">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center justify-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-medium">{player.player_name}</span>
                    {player.is_host && <Crown className="w-4 h-4 text-yellow-500" />}
                  </div>
                ))}
              </div>
            </div>
            
            <Button onClick={joinGame} size="lg" className="w-full">
              Join Game
            </Button>
          </Card>
          
          <ColorPickerDialog
            open={showColorPicker}
            onColorSelect={handleColorSelect}
            onCancel={handleColorPickerCancel}
            takenColors={players.map(p => p.color)}
          />
        </div>
      </div>
    );
  }

  // If user is not in the game and it's already started
  if (!isPlayerInGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean to-primary flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg mb-4">This game has already started</p>
          <Button onClick={() => navigate('/lobby')}>Back to Lobby</Button>
        </Card>
      </div>
    );
  }

  // Game waiting room for players
  if (game.status === 'waiting' && isPlayerInGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean to-primary p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => navigate('/lobby')} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Lobby
          </Button>
          
          <Card className="p-8 bg-card/95 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">{game.name}</h1>
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                <Users className="w-5 h-5" />
                <span>{players.length}/8 players</span>
              </div>
              <p className="text-muted-foreground">Waiting for players to join...</p>
            </div>
            
            <div className="grid gap-4 mb-8">
              {players.map((player) => (
                <div key={player.id} className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="font-medium flex-1">{player.player_name}</span>
                  {player.is_host && <Crown className="w-5 h-5 text-yellow-500" />}
                  {player.user_id === user?.id && <span className="text-sm text-primary">(You)</span>}
                </div>
              ))}
            </div>
            
            {currentPlayer?.is_host && players.length >= 2 && (
              <div className="text-center">
                <Button onClick={startGame} size="lg" className="gap-2">
                  <Play className="w-5 h-5" />
                  Start Game ({players.length} Players)
                </Button>
              </div>
            )}
            
            {currentPlayer?.is_host && players.length < 2 && (
              <p className="text-center text-muted-foreground">Need at least 2 players to start</p>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Active game interface (this will show when game.status === 'active')
  console.log('Game status:', game.status, 'Game phase:', game.game_phase, 'Is player in game:', isPlayerInGame);
  const selectedCountriesArray = gameCountries.map(gc => gc.country_id);
  
  const selectedCountriesMap: Record<string, string> = {};
  gameCountries.forEach(gc => {
    const player = players.find(p => p.id === gc.player_id);
    if (player) {
      selectedCountriesMap[gc.country_id] = player.player_name;
    }
  });

  // Calculate empire stats for display
  const gameStatsCountries = gameCountries.map(gc => {
    const country = GAME_COUNTRIES.find(c => c.id === gc.country_id);
    const player = players.find(p => p.id === gc.player_id);
    return {
      ...country!,
      selectedBy: player?.player_name || '',
    };
  }).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean to-primary">
      <div className="flex h-screen">
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 bg-card/90 backdrop-blur-sm border-b">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-card-foreground">{game.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              {currentPlayer?.is_host && game.game_phase === 'playing' && (
                <Button onClick={endVotingPhase} variant="outline" size="sm">
                  End voting
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                {players.length} Players
              </span>
            </div>
          </div>

          {/* Game Map */}
          <div className="flex-1">
            <GameMap
              countries={GAME_COUNTRIES}
              onCountrySelect={selectCountry}
              currentPlayer={(() => {
                const currentTurnPlayer = players.find(p => p.player_order === game?.current_player_turn);
                return currentTurnPlayer?.player_name || '';
              })()}
              selectedCountries={selectedCountriesArray}
              players={players.map(p => ({ 
                id: p.id, 
                name: p.player_name, 
                color: p.color, 
                countries: gameStatsCountries.filter(c => c.selectedBy === p.player_name).map(c => c.id),
                isActive: p.player_order === game?.current_player_turn
              }))}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-card/95 backdrop-blur-sm border-l overflow-y-auto">
          {game.game_phase === 'battle' ? (
            <div className="p-4">
              <WarDeclaration
                gameId={gameId!}
                currentPlayer={currentPlayer!}
                players={players}
                gameCountries={gameCountries}
                isPlayerTurn={game.current_player_turn === currentPlayer?.player_order}
              />
            </div>
          ) : (
            <EmpireStats
              players={players.map(p => ({ 
                id: p.id, 
                name: p.player_name, 
                color: p.color,
                countries: gameStatsCountries.filter(c => c.selectedBy === p.player_name).map(c => c.id),
                isActive: p.player_order === game?.current_player_turn
              }))}
              countries={gameStatsCountries}
              currentPlayer={currentPlayer ? { 
                id: currentPlayer.id, 
                name: currentPlayer.player_name, 
                color: currentPlayer.color,
                countries: gameStatsCountries.filter(c => c.selectedBy === currentPlayer.player_name).map(c => c.id),
                isActive: false
              } : undefined}
              gamePhase="selection"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGame;