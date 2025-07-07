import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GAME_COUNTRIES } from '@/data/gameCountries';
import { Sword, Shield, Crown } from 'lucide-react';

interface GamePlayer {
  id: string;
  user_id: string;
  player_name: string;
  color: string;
  player_order: number;
  is_host: boolean;
}

interface GameCountry {
  country_id: string;
  player_id: string;
}

interface WarDeclaration {
  id: string;
  attacking_player_id: string;
  defending_player_id: string;
  attacking_country_id: string;
  defending_country_id: string;
  status: string;
  winner_player_id?: string;
}

interface WarDeclarationProps {
  gameId: string;
  currentPlayer: GamePlayer;
  players: GamePlayer[];
  gameCountries: GameCountry[];
  isPlayerTurn: boolean;
}

const WarDeclaration: React.FC<WarDeclarationProps> = ({
  gameId,
  currentPlayer,
  players,
  gameCountries,
  isPlayerTurn
}) => {
  const { toast } = useToast();
  const [warDeclarations, setWarDeclarations] = useState<WarDeclaration[]>([]);
  const [selectedOwnCountry, setSelectedOwnCountry] = useState<string>('');
  const [selectedEnemyCountry, setSelectedEnemyCountry] = useState<string>('');
  const [declaringWar, setDeclaringWar] = useState(false);

  useEffect(() => {
    loadWarDeclarations();
    setupWarDeclarationSubscription();
  }, [gameId]);

  const loadWarDeclarations = async () => {
    const { data, error } = await supabase
      .from('war_declarations')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading war declarations:', error);
      return;
    }

    setWarDeclarations(data || []);
  };

  const setupWarDeclarationSubscription = () => {
    const channel = supabase
      .channel(`war-declarations-${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'war_declarations',
        filter: `game_id=eq.${gameId}`
      }, () => {
        loadWarDeclarations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const declareWar = async () => {
    if (!selectedOwnCountry || !selectedEnemyCountry) {
      toast({
        title: "Select countries",
        description: "You must select both your country and an enemy country.",
        variant: "destructive",
      });
      return;
    }

    setDeclaringWar(true);

    try {
      const enemyCountry = gameCountries.find(gc => gc.country_id === selectedEnemyCountry);
      if (!enemyCountry) throw new Error('Enemy country not found');

      const { error } = await supabase
        .from('war_declarations')
        .insert({
          game_id: gameId,
          attacking_player_id: currentPlayer.id,
          defending_player_id: enemyCountry.player_id,
          attacking_country_id: selectedOwnCountry,
          defending_country_id: selectedEnemyCountry,
        });

      if (error) throw error;

      setSelectedOwnCountry('');
      setSelectedEnemyCountry('');
      
      toast({
        title: "War declared!",
        description: "Waiting for the defender's response.",
      });
    } catch (error: any) {
      toast({
        title: "Error declaring war",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeclaringWar(false);
    }
  };

  const respondToWar = async (warId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('war_declarations')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', warId);

      if (error) throw error;

      toast({
        title: accept ? "War accepted!" : "War declined",
        description: accept ? "Prepare for battle!" : "The war declaration was declined.",
      });
    } catch (error: any) {
      toast({
        title: "Error responding to war",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCountryName = (countryId: string) => {
    const country = GAME_COUNTRIES.find(c => c.id === countryId);
    return country?.name || countryId;
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.player_name || 'Unknown';
  };

  const ownCountries = gameCountries.filter(gc => gc.player_id === currentPlayer.id);
  const enemyCountries = gameCountries.filter(gc => gc.player_id !== currentPlayer.id);

  const pendingWarAgainstMe = warDeclarations.find(wd => 
    wd.defending_player_id === currentPlayer.id && wd.status === 'pending'
  );

  return (
    <div className="space-y-4">
      {/* Pending war declaration against current player */}
      {pendingWarAgainstMe && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="flex items-center gap-3 mb-3">
            <Sword className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-destructive">War Declaration!</h3>
          </div>
          <p className="text-sm mb-4">
            <strong>{getPlayerName(pendingWarAgainstMe.attacking_player_id)}</strong> has declared war!
            <br />
            <strong>{getCountryName(pendingWarAgainstMe.attacking_country_id)}</strong> attacks <strong>{getCountryName(pendingWarAgainstMe.defending_country_id)}</strong>
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => respondToWar(pendingWarAgainstMe.id, true)}
              variant="destructive"
              size="sm"
            >
              <Sword className="w-4 h-4 mr-2" />
              Accept War
            </Button>
            <Button 
              onClick={() => respondToWar(pendingWarAgainstMe.id, false)}
              variant="outline"
              size="sm"
            >
              <Shield className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        </Card>
      )}

      {/* War declaration interface */}
      {isPlayerTurn && !pendingWarAgainstMe && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Sword className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Declare War</h3>
          </div>
          
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your attacking country:</label>
              <select 
                value={selectedOwnCountry}
                onChange={(e) => setSelectedOwnCountry(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">Select your country...</option>
                {ownCountries.map(gc => (
                  <option key={gc.country_id} value={gc.country_id}>
                    {getCountryName(gc.country_id)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Enemy country to attack:</label>
              <select 
                value={selectedEnemyCountry}
                onChange={(e) => setSelectedEnemyCountry(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">Select enemy country...</option>
                {enemyCountries.map(gc => {
                  const playerName = getPlayerName(gc.player_id);
                  return (
                    <option key={gc.country_id} value={gc.country_id}>
                      {getCountryName(gc.country_id)} ({playerName})
                    </option>
                  );
                })}
              </select>
            </div>

            <Button 
              onClick={declareWar}
              disabled={!selectedOwnCountry || !selectedEnemyCountry || declaringWar}
              className="w-full"
            >
              <Sword className="w-4 h-4 mr-2" />
              {declaringWar ? 'Declaring War...' : 'Declare War'}
            </Button>
          </div>
        </Card>
      )}

      {/* Recent war declarations */}
      {warDeclarations.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Recent Wars</h3>
          <div className="space-y-2">
            {warDeclarations.slice(0, 3).map(wd => (
              <div key={wd.id} className="text-sm p-2 bg-muted/30 rounded">
                <span className="font-medium">{getPlayerName(wd.attacking_player_id)}</span> declared war on{' '}
                <span className="font-medium">{getPlayerName(wd.defending_player_id)}</span>
                <br />
                <span className="text-xs text-muted-foreground">
                  {getCountryName(wd.attacking_country_id)} vs {getCountryName(wd.defending_country_id)} - {wd.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!isPlayerTurn && !pendingWarAgainstMe && (
        <Card className="p-4 text-center">
          <p className="text-muted-foreground">Waiting for your turn...</p>
        </Card>
      )}
    </div>
  );
};

export default WarDeclaration;