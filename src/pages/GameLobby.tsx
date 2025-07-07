import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, LogOut, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ColorPickerDialog from '@/components/ColorPickerDialog';

interface Game {
  id: string;
  name: string;
  status: string;
  created_by: string;
  created_at: string;
  game_players: Array<{
    player_name: string;
    color: string;
    is_host: boolean;
  }>;
}

const GameLobby = () => {
  const { user, signOut } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [newGameName, setNewGameName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          game_players (
            player_name,
            color,
            is_host
          )
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createGame = async () => {
    if (!newGameName.trim()) return;
    
    setLoading(true);
    try {
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          name: newGameName,
          created_by: user?.id
        })
        .select()
        .single();

      if (gameError) throw gameError;

      setSelectedGameId(game.id);
      setIsCreatingGame(true);
      setShowColorPicker(true);
      setNewGameName('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (gameId: string) => {
    try {
      const { data: existingPlayer } = await supabase
        .from('game_players')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', user?.id)
        .single();

      if (existingPlayer) {
        navigate(`/game/${gameId}`);
        return;
      }

      // Check if game is full
      const { data: players } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId);

      if (players && players.length >= 8) {
        toast({
          title: "Game is full",
          description: "This game already has the maximum number of players.",
          variant: "destructive",
        });
        return;
      }

      setSelectedGameId(gameId);
      setShowColorPicker(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleColorSelect = async (selectedColor: string) => {
    try {
      const { data: players } = await supabase
        .from('game_players')
        .select('player_order')
        .eq('game_id', selectedGameId)
        .order('player_order', { ascending: false })
        .limit(1);

      const nextOrder = players && players.length > 0 ? players[0].player_order + 1 : 0;
      const isHost = isCreatingGame;

      const { error } = await supabase
        .from('game_players')
        .insert({
          game_id: selectedGameId,
          user_id: user?.id,
          player_name: user?.user_metadata?.display_name || user?.email || 'Player',
          color: selectedColor,
          player_order: nextOrder,
          is_host: isHost
        });

      if (error) throw error;

      setShowColorPicker(false);
      
      if (isCreatingGame) {
        toast({
          title: "Game created!",
          description: "Your game is ready for players to join.",
        });
        setIsCreatingGame(false);
      }
      
      navigate(`/game/${selectedGameId}`);
    } catch (error: any) {
      toast({
        title: isCreatingGame ? "Error creating game" : "Error joining game",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleColorPickerCancel = () => {
    setShowColorPicker(false);
    setSelectedGameId('');
    
    if (isCreatingGame) {
      setIsCreatingGame(false);
      // If canceling game creation, we should delete the created game
      supabase.from('games').delete().eq('id', selectedGameId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean to-primary p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">GeoPolitical Strategy</h1>
            <p className="text-white/80">Welcome, {user?.user_metadata?.display_name || user?.email}</p>
          </div>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Create Game */}
        <Card className="p-6 mb-8 bg-card/95 backdrop-blur-sm">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="gameName" className="text-lg font-semibold">Create New Game</Label>
              <Input
                id="gameName"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                placeholder="Enter game name"
                className="mt-2"
                onKeyPress={(e) => e.key === 'Enter' && createGame()}
              />
            </div>
            <Button onClick={createGame} disabled={!newGameName.trim() || loading} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Game
            </Button>
          </div>
        </Card>

        {/* Games List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Available Games</h2>
          {games.length === 0 ? (
            <Card className="p-8 text-center bg-card/95 backdrop-blur-sm">
              <p className="text-muted-foreground">No games available. Create one to get started!</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {games.map((game) => (
                <Card key={game.id} className="p-4 bg-card/95 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{game.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Users className="w-4 h-4" />
                        <span>{game.game_players.length}/8 players</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {game.game_players.slice(0, 3).map((player, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: player.color }}
                          title={player.player_name}
                        />
                      ))}
                      {game.game_players.length > 3 && (
                        <span className="text-sm text-muted-foreground">+{game.game_players.length - 3}</span>
                      )}
                      <Button onClick={() => joinGame(game.id)} className="gap-2">
                        <Play className="w-4 h-4" />
                        Join Game
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <ColorPickerDialog
          open={showColorPicker}
          onColorSelect={handleColorSelect}
          onCancel={handleColorPickerCancel}
          takenColors={games.find(g => g.id === selectedGameId)?.game_players.map(p => p.color) || []}
        />
      </div>
    </div>
  );
};

export default GameLobby;