import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Map, Flag } from 'lucide-react';

interface EmpireStatsProps {
  playerName: string;
  countries: string[];
  totalPopulation: number;
  totalArea: number;
  totalGDP: number;
  rank: number;
}

const EmpireStats: React.FC<EmpireStatsProps> = ({
  playerName,
  countries,
  totalPopulation,
  totalArea,
  totalGDP,
  rank
}) => {
  const formatNumber = (num: number) => {
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
    <Card className="animate-strategic-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-primary">
              {playerName}'s Empire
            </CardTitle>
            <CardDescription>Your global dominion</CardDescription>
          </div>
          <Badge 
            className={`${getRankColor(rank)} text-sm font-bold px-3 py-1`}
            variant="secondary"
          >
            #{rank} {getRankIcon(rank)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Countries Owned */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" />
            <span className="font-semibold">Territories</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {countries.map((country, index) => (
              <Badge 
                key={country} 
                variant="outline" 
                className="text-xs border-primary/30 hover:bg-primary/10"
              >
                {country}
              </Badge>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            {countries.length} countries under your rule
          </div>
        </div>

        {/* Population Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-semibold">Population</span>
            </div>
            <span className="text-lg font-bold text-primary">
              {formatNumber(totalPopulation)}
            </span>
          </div>
          <Progress 
            value={(totalPopulation / 8000000000) * 100} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground">
            {((totalPopulation / 8000000000) * 100).toFixed(1)}% of world population
          </div>
        </div>

        {/* Land Area Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-primary" />
              <span className="font-semibold">Land Area</span>
            </div>
            <span className="text-lg font-bold text-primary">
              {formatNumber(totalArea)} km²
            </span>
          </div>
          <Progress 
            value={(totalArea / 149000000) * 100} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground">
            {((totalArea / 149000000) * 100).toFixed(1)}% of world's land
          </div>
        </div>

        {/* GDP Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <span className="font-semibold">GDP</span>
            </div>
            <span className="text-lg font-bold text-accent">
              ${formatNumber(totalGDP)}
            </span>
          </div>
          <Progress 
            value={(totalGDP / 100000) * 100} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground">
            {((totalGDP / 100000) * 100).toFixed(1)}% of world GDP
          </div>
        </div>

        {/* Empire Score */}
        <div className="pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent animate-empire-glow">
              Empire Score: {Math.round((totalPopulation / 1000000) + (totalArea / 10000) + totalGDP)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Based on population, territory & economy
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmpireStats;