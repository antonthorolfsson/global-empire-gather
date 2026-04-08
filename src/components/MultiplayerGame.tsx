import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import GameMap from './GameMap';
import EmpireStats from './EmpireStats';
import ColorPickerDialog from './ColorPickerDialog';
import WarDeclaration from './WarDeclaration';
import { GameChat } from './GameChat';
import CountryPreselection from './CountryPreselection';
import CountrySelectionPane from './CountrySelectionPane';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useToast } from '@/hooks/use-toast';
import { GAME_COUNTRIES } from '@/data/gameCountries';
import { ArrowLeft, Play, Users, Crown, Map, BarChart3, Swords, List } from 'lucide-react';
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
  const [userPlayer, setUserPlayer] = useState<GamePlayer | null>(null); // The logged-in user's player record
  const [loading, setLoading] = useState(true);
  const [isPlayerInGame, setIsPlayerInGame] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [lastAutoVoteTime, setLastAutoVoteTime] = useState<number>(0);
  const [preselectionList, setPreselectionList] = useState<string[]>([]);
  const [autoSelectTimer, setAutoSelectTimer] = useState<NodeJS.Timeout | null>(null);
  const [isSavingPreselections, setIsSavingPreselections] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoVoteIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!gameId) return;
    
    loadGameData();
    const cleanup = setupRealtimeSubscriptions();
    
    // Set up auto-vote checking interval (every 15 seconds)
    const autoVoteInterval = setInterval(async () => {
      if (game?.status === 'active' && game?.game_phase === 'playing') {
        try {
          await supabase.rpc('trigger_auto_vote_check');
        } catch (error) {
          console.error('Auto-vote check failed:', error);
        }
      }
    }, 15000); // Check every 15 seconds
    
    autoVoteIntervalRef.current = autoVoteInterval;
    
    return () => {
      cleanup();
      if (autoVoteIntervalRef.current) {
        clearInterval(autoVoteIntervalRef.current);
        autoVoteIntervalRef.current = null;
      }
    };
  }, [gameId, user, game?.status, game?.game_phase]);

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
        console.log('User player:', userPlayer);
        setUserPlayer(userPlayer);
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
        
        // Check if this was an auto-vote (rapid country selection)
        if (payload.eventType === 'INSERT' && payload.new) {
          const now = Date.now();
          const timeSinceLastVote = now - lastAutoVoteTime;
          
          // If this selection happened very quickly after the last one (likely auto-vote)
          if (timeSinceLastVote < 5000) { // Within 5 seconds
            const selectedCountry = GAME_COUNTRIES.find(c => c.id === payload.new.country_id);
            const player = players.find(p => p.id === payload.new.player_id);
            
            if (selectedCountry && player) {
              toast({
                title: "Auto-selection",
                description: `${player.player_name} auto-selected ${selectedCountry.name} from their preselection list`,
                duration: 3000,
              });
            }
          }
          
          setLastAutoVoteTime(now);
        }
        
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
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'war_declarations',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        console.log('War declaration updated:', payload);
        // Check if war was accepted and current user is involved
        if (payload.new.status === 'accepted' && userPlayer) {
          const warData = payload.new as any;
          if (warData.attacking_player_id === userPlayer.id || warData.defending_player_id === userPlayer.id) {
            toast({
              title: "War accepted!",
              description: "Redirecting to chess battle...",
            });
            setTimeout(() => {
              navigate(`/chess/${warData.id}`);
            }, 1500);
          }
        }
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(gameChannel);
      if (autoSelectTimer) {
        clearTimeout(autoSelectTimer);
      }
    };
  };

  // Load preselections for current player
  useEffect(() => {
    const loadPreselections = async () => {
      if (!userPlayer?.id || !gameId) return;
      
      const { data, error } = await supabase
        .from('player_preselections')
        .select('country_id, position')
        .eq('player_id', userPlayer.id)
        .eq('game_id', gameId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error loading preselections:', error);
        return;
      }

      const loadedList = data.map(p => p.country_id);
      setPreselectionList(loadedList);
    };

    loadPreselections();
  }, [userPlayer?.id, gameId]);

  // Auto-select logic when it's player's turn and preselection list has items
  useEffect(() => {
    const isCurrentPlayerTurn = game?.current_player_turn === userPlayer?.player_order;
    
    if (isCurrentPlayerTurn && preselectionList.length > 0 && !autoSelectTimer) {
      const timer = setTimeout(() => {
        const firstCountry = preselectionList[0];
        const selectedCountryIds = gameCountries
          .filter(gc => gc.player_id !== null)
          .map(gc => gc.country_id);
          
        if (firstCountry && !selectedCountryIds.includes(firstCountry)) {
          selectCountry(firstCountry);
          setPreselectionList(prev => prev.slice(1)); // Remove the selected country
        }
      }, 2000); // 2 second delay to give user time to react
      
      setAutoSelectTimer(timer);
    }

    return () => {
      if (autoSelectTimer) {
        clearTimeout(autoSelectTimer);
        setAutoSelectTimer(null);
      }
    };
  }, [game?.current_player_turn, userPlayer?.player_order, preselectionList, autoSelectTimer, gameCountries]);

  // Remove countries from preselection list when they get selected by others
  useEffect(() => {
    const selectedCountryIds = gameCountries
      .filter(gc => gc.player_id !== null)
      .map(gc => gc.country_id);
    const filteredList = preselectionList.filter(countryId => !selectedCountryIds.includes(countryId));
    // Only update if the list actually changed to avoid triggering unnecessary saves
    if (filteredList.length !== preselectionList.length) {
      setPreselectionList(filteredList);
    }
  }, [gameCountries]);

  // Save preselections to database whenever the list changes
  useEffect(() => {
    if (!userPlayer?.id || !gameId) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const savePreselections = async () => {
      // Double-check saving state when function actually executes
      if (isSavingPreselections) {
        console.log('Save already in progress, skipping...');
        return;
      }
      
      setIsSavingPreselections(true);
      console.log('Saving preselections:', preselectionList);
      
      try {
        // First, clear all existing preselections for this player
        const { error: deleteError } = await supabase
          .from('player_preselections')
          .delete()
          .eq('player_id', userPlayer.id)
          .eq('game_id', gameId);

        if (deleteError) {
          console.error('Error deleting old preselections:', deleteError);
          throw deleteError;
        }

        // Then insert new preselections if any exist
        if (preselectionList.length > 0) {
          const insertData = preselectionList.map((countryId, index) => ({
            player_id: userPlayer.id,
            game_id: gameId,
            country_id: countryId,
            position: index + 1
          }));

          console.log('Inserting preselections:', insertData);

          const { error: insertError } = await supabase
            .from('player_preselections')
            .insert(insertData);

          if (insertError) {
            console.error('Error inserting preselections:', insertError);
            throw insertError;
          }

          console.log('Successfully saved preselections');
        } else {
          console.log('No preselections to save (empty list)');
        }
      } catch (error) {
        console.error('Failed to save preselections:', error);
        toast({
          title: "Error",
          description: "Failed to save preselection list",
          variant: "destructive",
        });
      } finally {
        setIsSavingPreselections(false);
      }
    };

    // Schedule save with timeout, don't check isSavingPreselections here since it can change
    saveTimeoutRef.current = setTimeout(savePreselections, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [preselectionList, userPlayer?.id, gameId, toast]);

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
    if (!userPlayer?.is_host) return;

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
    if (!userPlayer?.is_host) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          game_phase: 'finished'
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

  const completeGame = async () => {
    if (!userPlayer?.is_host) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'finished',
          game_phase: 'finished'
        })
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: "Game completed!",
        description: "The game has been marked as completed.",
      });
    } catch (error: any) {
      toast({
        title: "Error completing game",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const selectCountry = async (countryId: string) => {
    console.log('Selecting country:', countryId, 'User player:', userPlayer, 'Game status:', game?.status, 'Game phase:', game?.game_phase);
    
    if (!isPlayerInGame || !userPlayer || game?.status !== 'active') {
      console.log('Cannot select country:', { isPlayerInGame, hasUserPlayer: !!userPlayer, gameStatus: game?.status });
      return;
    }

    // Prevent country selection during finished phase (chess-only phase)
    if (game?.game_phase === 'finished') {
      toast({
        title: "Country selection disabled",
        description: "Countries can only be gained through chess battles now!",
        variant: "destructive",
      });
      return;
    }

    // Check if it's this player's turn
    console.log('=== TURN CHECK DEBUG ===');
    console.log('Game current_player_turn:', game.current_player_turn);
    console.log('User player order:', userPlayer.player_order);
    console.log('Is user turn?', game.current_player_turn === userPlayer.player_order);
    console.log('All players orders:', players.map(p => ({ name: p.player_name, order: p.player_order, id: p.id })));
    console.log('========================');
    
    if (game.current_player_turn !== userPlayer.player_order) {
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

      console.log('Inserting country selection:', { gameId, countryId, playerId: userPlayer.id });

      // Use secure transaction approach to prevent race conditions
      console.log('Using secure transaction approach...');
      
      // Double-check the game hasn't been updated since we started
      const { data: currentGame, error: gameCheckError } = await supabase
        .from('games')
        .select('current_player_turn')
        .eq('id', gameId)
        .single();

      if (gameCheckError) {
        console.error('Error checking game state:', gameCheckError);
        throw gameCheckError;
      }

      if (currentGame.current_player_turn !== game.current_player_turn) {
        console.error('Game turn changed during selection!');
        throw new Error('Game turn changed during selection. Please try again.');
      }

      // Insert the country selection
      const { error: countryError } = await supabase
        .from('game_countries')
        .insert({
          game_id: gameId,
          country_id: countryId,
          player_id: userPlayer.id
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
      console.log('Next turn calculated:', nextPlayerTurn);
      console.log('===============================');
      
      // Update turn with race condition protection - only update if turn hasn't changed
      const { data: updateData, error: gameError } = await supabase
        .from('games')
        .update({ current_player_turn: nextPlayerTurn })
        .eq('id', gameId)
        .eq('current_player_turn', game.current_player_turn) // Critical: only update if turn hasn't changed
        .select();

      if (gameError) {
        console.error('Error updating turn:', gameError);
        throw gameError;
      }

      if (!updateData || updateData.length === 0) {
        console.error('No rows updated! Game turn may have changed');
        throw new Error('Failed to update game turn - another player may have acted first');
      }

      console.log('Turn update successful! Database should now show turn:', nextPlayerTurn);
      
      // Update local state immediately to prevent race condition
      setGame(prev => prev ? { ...prev, current_player_turn: nextPlayerTurn } : prev);

      console.log('Country selected successfully! Next turn:', nextPlayerTurn);
      const selectedCountry = GAME_COUNTRIES.find(c => c.id === countryId);
      const countryName = selectedCountry ? selectedCountry.name : countryId;
      toast({
        title: "Country selected!",
        description: `You've claimed ${countryName}!`,
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
            
            {userPlayer?.is_host && players.length >= 2 && (
              <div className="text-center">
                <Button onClick={startGame} size="lg" className="gap-2">
                  <Play className="w-5 h-5" />
                  Start Game ({players.length} Players)
                </Button>
              </div>
            )}
            
            {userPlayer?.is_host && players.length < 2 && (
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
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 lg:px-6 bg-card/90 backdrop-blur-sm border-b">
        <div className="flex items-center gap-2 lg:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg lg:text-xl font-bold text-card-foreground truncate">{game.name}</h1>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          {userPlayer?.is_host && game.game_phase === 'playing' && (
            <Button onClick={endVotingPhase} variant="outline" size="sm" className="text-xs lg:text-sm">
              End voting
            </Button>
          )}
          {userPlayer?.is_host && game.game_phase === 'finished' && (
            <Button onClick={completeGame} variant="outline" size="sm" className="text-xs lg:text-sm">
              Complete Game
            </Button>
          )}
          <span className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
            {players.length} Players
          </span>
        </div>
      </div>

      {/* Desktop Layout - 3 Column Resizable */}
      <div className="hidden lg:flex h-[calc(100vh-4rem)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Country Selection */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-card/95 backdrop-blur-sm">
            <div className="h-full flex flex-col overflow-hidden">
              {game.game_phase === 'playing' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b flex-shrink-0">
                    <h3 className="font-semibold">Country Selection</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <CountryPreselection
                      onCountrySelect={selectCountry}
                      selectedCountries={selectedCountriesArray}
                      isPlayerTurn={game.current_player_turn === userPlayer?.player_order}
                      gameId={game.id}
                      playerId={userPlayer?.id || ''}
                      preselectionList={preselectionList}
                      setPreselectionList={setPreselectionList}
                      autoSelectTimer={autoSelectTimer}
                    />
                  </div>
                </div>
              )}
              
              {game.game_phase === 'finished' && (
                <div className="p-4 space-y-3 overflow-y-auto">
                  <h3 className="font-semibold">War Declaration</h3>
                  <WarDeclaration
                    gameId={gameId!}
                    currentPlayer={userPlayer!}
                    players={players}
                    gameCountries={gameCountries}
                    isPlayerTurn={true}
                  />
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Panel - Map */}
          <ResizablePanel defaultSize={50} minSize={40} maxSize={70}>
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
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Empire Stats */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-card/95 backdrop-blur-sm">
            <div className="h-full overflow-y-auto">
              <div className="p-4">
                <EmpireStats
                  players={players.map(p => ({ 
                    id: p.id, 
                    name: p.player_name, 
                    color: p.color,
                    countries: gameStatsCountries.filter(c => c.selectedBy === p.player_name).map(c => c.id),
                    isActive: p.player_order === game?.current_player_turn
                  }))}
                  countries={gameStatsCountries}
                  currentPlayer={userPlayer ? { 
                    id: userPlayer.id, 
                    name: userPlayer.player_name, 
                    color: userPlayer.color,
                    countries: gameStatsCountries.filter(c => c.selectedBy === userPlayer.player_name).map(c => c.id),
                    isActive: false
                  } : undefined}
                  gamePhase={game.game_phase as 'setup' | 'selection' | 'finished'}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile Tabbed Layout */}
      <div className="lg:hidden h-[calc(100vh-4rem)]">
        <Tabs defaultValue="map" className="flex flex-col h-full">
          <TabsList className="flex w-full mx-2 my-2">
            <TabsTrigger value="map" className="flex-1 gap-1 px-2 py-1.5">
              <Map className="w-4 h-4" />
              <span className="text-xs">Map</span>
            </TabsTrigger>
            {game.game_phase === 'playing' && (
              <TabsTrigger value="preselection" className="flex-1 gap-1 px-2 py-1.5">
                <List className="w-4 h-4" />
                <span className="text-xs">Countries</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="stats" className="flex-1 gap-1 px-2 py-1.5">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">Stats</span>
            </TabsTrigger>
            {game.game_phase === 'finished' && (
              <TabsTrigger value="wars" className="flex-1 gap-1 px-2 py-1.5">
                <Swords className="w-4 h-4" />
                <span className="text-xs">Wars</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="map" className="flex-1 m-0 p-0">
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
          </TabsContent>
          
          {game.game_phase === 'playing' && (
            <TabsContent value="preselection" className="flex-1 m-0 p-0 bg-background">
                <CountryPreselection
                  onCountrySelect={selectCountry}
                  selectedCountries={selectedCountriesArray}
                  isPlayerTurn={game.current_player_turn === userPlayer?.player_order}
                  gameId={game.id}
                  playerId={userPlayer?.id || ''}
                  preselectionList={preselectionList}
                  setPreselectionList={setPreselectionList}
                  autoSelectTimer={autoSelectTimer}
                />
            </TabsContent>
          )}
          
          <TabsContent value="stats" className="flex-1 m-0 p-0 overflow-y-auto">
            <EmpireStats
              players={players.map(p => ({ 
                id: p.id, 
                name: p.player_name, 
                color: p.color,
                countries: gameStatsCountries.filter(c => c.selectedBy === p.player_name).map(c => c.id),
                isActive: p.player_order === game?.current_player_turn
              }))}
              countries={gameStatsCountries}
              currentPlayer={userPlayer ? { 
                id: userPlayer.id, 
                name: userPlayer.player_name, 
                color: userPlayer.color,
                countries: gameStatsCountries.filter(c => c.selectedBy === userPlayer.player_name).map(c => c.id),
                isActive: false
              } : undefined}
              gamePhase={game.game_phase as 'setup' | 'selection' | 'finished'}
            />
          </TabsContent>
          
          <TabsContent value="wars" forceMount className="m-0 p-4 overflow-y-auto data-[state=inactive]:hidden" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
            {game.game_phase === 'finished' && userPlayer ? (
              <div className="space-y-3">
                <h3 className="font-semibold">War Declaration</h3>
                <WarDeclaration
                  gameId={gameId!}
                  currentPlayer={userPlayer}
                  players={players}
                  gameCountries={gameCountries}
                  isPlayerTurn={true}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Loading...</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Component */}
      {userPlayer && (
        <div className="fixed bottom-4 right-4 z-50">
          <GameChat
            gameId={gameId!}
            currentPlayerId={userPlayer.id}
            isCollapsed={!showChat}
            onToggle={() => setShowChat(!showChat)}
          />
        </div>
      )}
    </div>
  );
};

export default MultiplayerGame;