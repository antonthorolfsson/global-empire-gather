import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, LogOut, Play, Trash2, GamepadIcon, Mail, Lock, Globe, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ColorPickerDialog from '@/components/ColorPickerDialog';
import { useRateLimit } from '@/hooks/useRateLimit';
import { validateGameName, validateEmail, sanitizeText } from '@/utils/security';

interface Game {
  id: string;
  name: string;
  status: string;
  created_by: string;
  created_at: string;
  is_public: boolean;
  current_player_turn: number | null;
  game_phase: string;
  game_players: Array<{
    player_name: string;
    color: string;
    is_host: boolean;
    user_id: string;
    player_order: number;
  }>;
}

const GameLobby = () => {
  const { user, signOut } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [newGameName, setNewGameName] = useState('');
  const [isPublicGame, setIsPublicGame] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkRateLimit, isChecking } = useRateLimit();

  useEffect(() => {
    fetchGames();

    const channel = supabase
      .channel('lobby-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
      }, () => {
        fetchGames();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_players',
      }, () => {
        fetchGames();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGames = async () => {
    try {
      // Fetch all public games and games user is in or invited to
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          game_players (
            player_name,
            color,
            is_host,
            user_id,
            player_order
          )
        `)
        .or(`is_public.eq.true,created_by.eq.${user?.id}`)
        .in('status', ['waiting', 'active'])
        .is('deleted_at', null)
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
    
    // Validate game name
    const validation = validateGameName(newGameName);
    if (!validation.isValid) {
      toast({
        title: "Invalid game name",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Check rate limit
    const canProceed = await checkRateLimit('game_creation');
    if (!canProceed) return;
    
    setLoading(true);
    try {
      // Call the validation function from database
      const { error: validationError } = await supabase.rpc('validate_game_input', {
        _name: newGameName.trim(),
        _max_players: 8
      });

      if (validationError) {
        throw new Error(validationError.message);
      }

      const sanitizedName = sanitizeText(newGameName, 50);
      
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          name: sanitizedName,
          created_by: user?.id,
          is_public: isPublicGame
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _user_id: user?.id,
        _action_type: 'game_created',
        _resource_type: 'game',
        _resource_id: game.id,
        _details: { name: sanitizedName, is_public: isPublicGame }
      });

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

  const startGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'active',
          game_phase: 'playing',
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: "Game started!",
        description: "The game has been started. Players can now select countries.",
      });

      fetchGames();
      navigate(`/game/${gameId}`);
    } catch (error: any) {
      toast({
        title: "Error starting game",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: "Game deleted",
        description: "The game has been deleted successfully.",
      });

      fetchGames();
    } catch (error: any) {
      toast({
        title: "Error deleting game",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const invitePlayer = async () => {
    if (!inviteEmail.trim() || !selectedGameId) return;
    
    // Validate email format
    if (!validateEmail(inviteEmail.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Check rate limit
    const canProceed = await checkRateLimit('email_invitation');
    if (!canProceed) return;
    
    try {
      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from('game_invitations')
        .select('id, status')
        .eq('game_id', selectedGameId)
        .eq('invitee_email', inviteEmail.trim())
        .single();

      if (existingInvitation) {
        if (existingInvitation.status === 'pending') {
          toast({
            title: "Invitation already sent",
            description: `${inviteEmail} has already been invited to this game.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Player already responded",
            description: `${inviteEmail} has already ${existingInvitation.status} the invitation.`,
            variant: "destructive",
          });
        }
        return;
      }

      // Create new invitation record
      const { data: invitation, error: insertError } = await supabase
        .from('game_invitations')
        .insert({
          game_id: selectedGameId,
          inviter_id: user?.id,
          invitee_email: inviteEmail.trim()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Get game details for the email
      const { data: game } = await supabase
        .from('games')
        .select('name')
        .eq('id', selectedGameId)
        .single();

      // Send the email using the edge function
      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: {
          invitationId: invitation.id,
          inviterName: user?.user_metadata?.display_name || user?.email || 'A player',
          gameName: game?.name || 'Game',
          inviteeEmail: inviteEmail.trim(),
        }
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
        toast({
          title: "Invitation created!",
          description: "Email delivery may be delayed, but the invitation is saved.",
        });
      } else {
        toast({
          title: "Invitation sent!",
          description: `Email invitation sent to ${inviteEmail}`,
        });
      }

      setInviteEmail('');
      setShowInviteDialog(false);
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean to-primary p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">GeoPolitical Strategy</h1>
            <p className="text-white/80 text-sm sm:text-base">Welcome, {user?.user_metadata?.display_name || user?.email}</p>
          </div>
          <Button variant="outline" onClick={signOut} className="gap-2 self-start sm:self-auto">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Create Game */}
        <Card className="p-4 sm:p-6 mb-8 bg-card/95 backdrop-blur-sm">
          <div className="space-y-4">
            <Label className="text-base sm:text-lg font-semibold">Create New Game</Label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="Enter game name"
                  onKeyPress={(e) => e.key === 'Enter' && createGame()}
                />
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="isPublic" className="text-sm flex items-center gap-2">
                  {isPublicGame ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {isPublicGame ? 'Public' : 'Private'}
                </Label>
                <Switch 
                  id="isPublic"
                  checked={isPublicGame} 
                  onCheckedChange={setIsPublicGame} 
                />
              </div>
              <Button onClick={createGame} disabled={!newGameName.trim() || loading} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Game
              </Button>
            </div>
          </div>
        </Card>

        {/* Games List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Your Games</h2>
          {games.length === 0 ? (
            <Card className="p-8 text-center bg-card/95 backdrop-blur-sm">
              <p className="text-muted-foreground">No games available. Create one to get started!</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {games.map((game) => {
                const isCreator = game.created_by === user?.id;
                const isInGame = game.game_players.some(p => p.user_id === user?.id);
                const canJoin = game.status === 'waiting' && !isInGame && game.game_players.length < 8;
                const canResume = game.status === 'active' && isInGame;
                const canStart = isCreator && game.status === 'waiting' && game.game_players.length >= 2;
                
                // Check if it's the user's turn
                const userPlayer = game.game_players.find(p => p.user_id === user?.id);
                const isUserTurn = game.status === 'active' && 
                  game.game_phase === 'playing' && 
                  userPlayer && 
                  game.current_player_turn === userPlayer.player_order;
                
                return (
                  <Card key={game.id} className="p-4 bg-card/95 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold truncate">{game.name}</h3>
                           <div className="flex items-center gap-2">
                             {game.status === 'active' && (
                               <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                 <GamepadIcon className="w-3 h-3" />
                                 Active
                               </div>
                             )}
                             {game.status === 'waiting' && (
                               <div className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                 <Users className="w-3 h-3" />
                                 Waiting
                               </div>
                             )}
                              {isUserTurn && (
                                <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full animate-pulse">
                                  <Bell className="w-3 h-3" />
                                  Your Turn!
                                </div>
                              )}
                              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                                game.is_public 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {game.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                {game.is_public ? 'Public' : 'Private'}
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 sm:mb-0">
                          <Users className="w-4 h-4" />
                          <span>{game.game_players.length}/8 players</span>
                          <div className="flex items-center gap-1 ml-2">
                            {game.game_players.slice(0, 3).map((player, idx) => (
                              <div
                                key={idx}
                                className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: player.color }}
                                title={player.player_name}
                              />
                            ))}
                            {game.game_players.length > 3 && (
                              <span className="text-xs text-muted-foreground ml-1">+{game.game_players.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {canJoin && (
                          <Button onClick={() => joinGame(game.id)} className="gap-2 w-full sm:w-auto">
                            <Play className="w-4 h-4" />
                            Join Game
                          </Button>
                        )}
                        
                        {canResume && (
                          <Button onClick={() => navigate(`/game/${game.id}`)} className="gap-2 w-full sm:w-auto">
                            <GamepadIcon className="w-4 h-4" />
                            Resume Game
                          </Button>
                        )}

                        {canStart && (
                          <Button onClick={() => startGame(game.id)} className="gap-2 w-full sm:w-auto">
                            <Play className="w-4 h-4" />
                            Start Game
                          </Button>
                        )}
                        
                        {isCreator && (
                          <>
                            <Dialog open={showInviteDialog && selectedGameId === game.id} onOpenChange={(open) => {
                              setShowInviteDialog(open);
                              if (open) setSelectedGameId(game.id);
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                                  <Mail className="w-4 h-4" />
                                  Invite
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Invite Friend to {game.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="inviteEmail">Friend's Email</Label>
                                    <Input
                                      id="inviteEmail"
                                      type="email"
                                      value={inviteEmail}
                                      onChange={(e) => setInviteEmail(e.target.value)}
                                      placeholder="Enter your friend's email"
                                      className="mt-2"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button onClick={invitePlayer} disabled={!inviteEmail.trim()} className="flex-1">
                                      Send Invitation
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              onClick={() => deleteGame(game.id)} 
                              variant="destructive" 
                              size="sm"
                              className="gap-2 w-full sm:w-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
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