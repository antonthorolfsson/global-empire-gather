import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ChessGame from '@/components/ChessGame';
import { GAME_COUNTRIES } from '@/data/gameCountries';

interface WarDeclaration {
  id: string;
  attacking_player_id: string;
  defending_player_id: string;
  attacking_country_id: string;
  defending_country_id: string;
  status: string;
  game_id: string;
}

interface GamePlayer {
  id: string;
  player_name: string;
  color: string;
}

const ChessBattle = () => {
  const { warId } = useParams<{ warId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [war, setWar] = useState<WarDeclaration | null>(null);
  const [players, setPlayers] = useState<Record<string, GamePlayer>>({});
  const [loading, setLoading] = useState(true);
  const [userPlayerSide, setUserPlayerSide] = useState<'white' | 'black' | null>(null);

  useEffect(() => {
    if (!warId) return;
    loadWarData();
  }, [warId]);

  const loadWarData = async () => {
    try {
      // Load war declaration
      const { data: warData, error: warError } = await supabase
        .from('war_declarations')
        .select('*')
        .eq('id', warId)
        .single();

      if (warError) throw warError;
      if (warData.status !== 'accepted') {
        toast({
          title: "Invalid war",
          description: "This war has not been accepted yet.",
          variant: "destructive",
        });
        navigate(-1);
        return;
      }

      setWar(warData);

      // Load player information
      const { data: playersData, error: playersError } = await supabase
        .from('game_players')
        .select('*')
        .in('id', [warData.attacking_player_id, warData.defending_player_id]);

      if (playersError) throw playersError;

      const playersMap: Record<string, GamePlayer> = {};
      playersData.forEach(player => {
        playersMap[player.id] = player;
      });
      setPlayers(playersMap);

      // Determine user's side (attacker = white, defender = black)
      const userPlayer = playersData.find(p => p.user_id === user?.id);
      if (userPlayer) {
        if (userPlayer.id === warData.attacking_player_id) {
          setUserPlayerSide('white');
        } else if (userPlayer.id === warData.defending_player_id) {
          setUserPlayerSide('black');
        }
      }

    } catch (error: any) {
      toast({
        title: "Error loading war",
        description: error.message,
        variant: "destructive",
      });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleGameEnd = async (winner: string) => {
    if (!war) return;

    try {
      // Determine the winning player ID
      const winningPlayerId = winner === 'white' ? war.attacking_player_id : war.defending_player_id;
      
      // Update the war declaration with the winner
      const { error: warError } = await supabase
        .from('war_declarations')
        .update({ 
          status: 'completed',
          winner_player_id: winningPlayerId
        })
        .eq('id', warId);

      if (warError) throw warError;

      // Transfer the defending country to the winner
      console.log('ChessBattle: Transferring country', war.defending_country_id, 'to winner', winningPlayerId);
      console.log('ChessBattle: War details:', { gameId: war.game_id, defendingCountryId: war.defending_country_id });
      
      const { data: beforeUpdate, error: beforeError } = await supabase
        .from('game_countries')
        .select('*')
        .eq('game_id', war.game_id)
        .eq('country_id', war.defending_country_id);
      
      console.log('ChessBattle: Country before update:', beforeUpdate);
      
      const { data: updatedCountry, error: countryError } = await supabase
        .from('game_countries')
        .update({ player_id: winningPlayerId })
        .eq('game_id', war.game_id)
        .eq('country_id', war.defending_country_id)
        .select();

      if (countryError) {
        console.error('ChessBattle: Error transferring country:', countryError);
        throw countryError;
      }
      
      console.log('ChessBattle: Country after update:', updatedCountry);
      
      console.log('ChessBattle: Country transferred successfully');

      const winnerName = players[winningPlayerId]?.player_name || 'Unknown';
      const countryName = getCountryName(war.defending_country_id);
      
      toast({
        title: "War Concluded!",
        description: `${winnerName} has won the chess battle and conquered ${countryName}!`,
      });

      // Navigate back to the game after a delay
      setTimeout(() => {
        navigate(`/game/${war.game_id}`);
      }, 3000);

    } catch (error: any) {
      toast({
        title: "Error updating war result",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCountryName = (countryId: string) => {
    const country = GAME_COUNTRIES.find(c => c.id === countryId);
    return country?.name || countryId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean to-primary flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!war) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean to-primary flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg mb-4">War not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean to-primary">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(`/game/${war.game_id}`)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Game
          </Button>
        </div>

        <Card className="p-6 bg-card/95 backdrop-blur-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Chess Battle</h1>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <span className="font-medium">{players[war.attacking_player_id]?.player_name}</span> ({getCountryName(war.attacking_country_id)})
                {' vs '}
                <span className="font-medium">{players[war.defending_player_id]?.player_name}</span> ({getCountryName(war.defending_country_id)})
              </p>
              {userPlayerSide && (
                <p>You are playing as <span className="font-medium capitalize">{userPlayerSide}</span></p>
              )}
            </div>
          </div>

          <ChessGame warId={warId!} userPlayerSide={userPlayerSide} onGameEnd={handleGameEnd} />
        </Card>
      </div>
    </div>
  );
};

export default ChessBattle;