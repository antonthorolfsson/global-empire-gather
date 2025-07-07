
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Plus } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  color: string;
}

interface PlayerLoginProps {
  onPlayersReady: (players: Player[]) => void;
}

const PLAYER_COLORS = [
  'hsl(215 80% 45%)',   // Strategic blue
  'hsl(0 75% 55%)',     // Strong red
  'hsl(120 60% 45%)',   // Forest green
  'hsl(45 90% 60%)',    // Empire gold
  'hsl(280 70% 55%)',   // Royal purple
  'hsl(30 80% 55%)',    // Orange
  'hsl(190 70% 45%)',   // Teal
  'hsl(320 60% 55%)',   // Pink
];

const PlayerLogin: React.FC<PlayerLoginProps> = ({ onPlayersReady }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');

  const addPlayer = () => {
    if (newPlayerName.trim() && players.length < 8) {
      const newPlayer: Player = {
        id: `player-${Date.now()}`,
        name: newPlayerName.trim(),
        color: PLAYER_COLORS[players.length],
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const startGame = () => {
    if (players.length >= 2) {
      onPlayersReady(players);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean to-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 bg-card/95 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">GeoPolitical Strategy</h1>
          <p className="text-muted-foreground">Add 2-8 players to start conquering the world</p>
        </div>

        <div className="space-y-6">
          {/* Add Player Section */}
          <div className="space-y-3">
            <Label htmlFor="playerName" className="text-lg font-semibold">Add Player</Label>
            <div className="flex gap-3">
              <Input
                id="playerName"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter player name"
                className="flex-1"
                disabled={players.length >= 8}
              />
              <Button 
                onClick={addPlayer} 
                disabled={!newPlayerName.trim() || players.length >= 8}
                className="px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {players.length}/8 players added (minimum 2 required)
            </p>
          </div>

          {/* Players List */}
          {players.length > 0 && (
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Players</Label>
              <div className="grid gap-3">
                {players.map((player, index) => (
                  <div 
                    key={player.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: player.color }}
                      />
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{player.name}</span>
                      <span className="text-sm text-muted-foreground">Player {index + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayer(player.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Game Button */}
          <div className="pt-4">
            <Button
              onClick={startGame}
              disabled={players.length < 2}
              className="w-full py-6 text-lg font-semibold"
              size="lg"
            >
              Start Game ({players.length} Players)
            </Button>
            {players.length < 2 && (
              <p className="text-sm text-destructive text-center mt-2">
                Add at least 2 players to start the game
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PlayerLogin;
