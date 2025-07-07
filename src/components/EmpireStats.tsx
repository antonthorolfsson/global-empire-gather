import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Map, Flag } from 'lucide-react';
import { Player, Country } from '@/hooks/useGameState';

interface EmpireStatsProps {
  players: Player[];
  countries: Country[];
  currentPlayer: Player | undefined;
  gamePhase: 'setup' | 'selection' | 'finished';
}

const EmpireStats: React.FC<EmpireStatsProps> = ({
  players,
  countries,
  currentPlayer,
  gamePhase
}) => {
  const getPlayerStats = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return null;

    const playerCountries = countries.filter(country => 
      player.countries.includes(country.id)
    );

    const totalPopulation = playerCountries.reduce((sum, c) => sum + (c.population || 0), 0);
    const totalArea = playerCountries.reduce((sum, c) => sum + (c.area || 0), 0);
    const totalGDP = playerCountries.reduce((sum, c) => sum + (c.gdp || 0), 0);

    // Calculate rank
    const allPlayerStats = players.map(p => {
      const pCountries = countries.filter(c => p.countries.includes(c.id));
      const pGDP = pCountries.reduce((sum, c) => sum + (c.gdp || 0), 0);
      return { playerId: p.id, gdp: pGDP };
    });
    
    allPlayerStats.sort((a, b) => b.gdp - a.gdp);
    const rank = allPlayerStats.findIndex(p => p.playerId === playerId) + 1;

    return {
      playerName: player.name,
      countries: player.countries,
      totalPopulation,
      totalArea,
      totalGDP,
      rank,
    };
  };
  const formatNumber = (num: number) => {
    // Check for NaN, null, undefined, or Infinity
    if (isNaN(num) || num == null || !isFinite(num)) {
      return '0';
    }
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-empire-gold text-empire-gold-foreground';
      case 2: return 'bg-empire-silver text-foreground';
      case 3: return 'bg-empire-bronze text-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRankIcon = (rank: number) => {
    const icons = ['👑', '🥈', '🥉', '🎖️'];
    return icons[rank - 1] || '🏅';
  };

  return (
    <div className="p-4 space-y-4">
      {/* Current Player Turn */}
      {gamePhase === 'selection' && currentPlayer && (
        <Card className="bg-primary/10 border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-primary">
              {currentPlayer.name}'s Turn
            </CardTitle>
            <CardDescription className="text-center">
              Select a country to expand your empire
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Player Stats */}
      {players.map((player) => {
        const stats = getPlayerStats(player.id);
        if (!stats) return null;

        return (
          <Card key={player.id} className="animate-strategic-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: player.color }}
                  />
                  <div>
                    <CardTitle className="text-lg font-bold text-primary">
                      {stats.playerName}
                    </CardTitle>
                    <CardDescription>Empire Stats</CardDescription>
                  </div>
                </div>
                <Badge 
                  className={`${getRankColor(stats.rank)} text-sm font-bold px-3 py-1`}
                  variant="secondary"
                >
                  #{stats.rank} {getRankIcon(stats.rank)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Countries Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Countries</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {stats.countries.length}
                </span>
              </div>

              {/* Population */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Population</span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {formatNumber(stats.totalPopulation)}
                </span>
              </div>

              {/* Land Area */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Land Area</span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {formatNumber(stats.totalArea)} km²
                </span>
              </div>

              {/* GDP */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💰</span>
                  <span className="font-semibold">GDP</span>
                </div>
                <span className="text-sm font-bold text-accent">
                  ${formatNumber(stats.totalGDP)}
                </span>
              </div>

              {/* Empire Score */}
              <div className="pt-2 border-t border-border">
                <div className="text-center">
                  <div className="text-lg font-bold text-accent">
                    Score: {formatNumber(Math.round((stats.totalPopulation / 1000000) + (stats.totalArea / 10000) + stats.totalGDP))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EmpireStats;