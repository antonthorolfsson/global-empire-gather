import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Map, Flag, PieChart } from 'lucide-react';
import { Player, Country } from '@/hooks/useGameState';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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

  // Prepare data for pie charts
  const getChartData = () => {
    const data = players.map(player => {
      const stats = getPlayerStats(player.id);
      if (!stats) return null;
      
      return {
        name: stats.playerName,
        population: stats.totalPopulation,
        area: stats.totalArea,
        gdp: stats.totalGDP,
        color: player.color,
        countries: stats.countries.length
      };
    }).filter(Boolean);

    return data;
  };

  const chartData = getChartData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <p className="font-medium text-card-foreground">{data.name}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {payload[0].name}: {formatNumber(payload[0].value)}
            {payload[0].dataKey === 'area' && ' km²'}
            {payload[0].dataKey === 'gdp' && ' USD'}
          </p>
          <p className="text-xs text-muted-foreground">
            {payload[0].dataKey === 'population' && `${data.countries} countries`}
            {payload[0].dataKey === 'area' && `${data.countries} territories`}
            {payload[0].dataKey === 'gdp' && `${data.countries} economies`}
          </p>
        </div>
      );
    }
    return null;
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

      {/* Empire Distribution Charts */}
      {chartData.length > 0 && (
        <>
          <Card className="animate-strategic-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Empire Distribution
              </CardTitle>
              <CardDescription>
                Compare the power balance between empires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Population Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-center">Population</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={chartData}
                          dataKey="population"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={25}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`population-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Land Area Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-center">Land Area</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={chartData}
                          dataKey="area"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={25}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`area-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* GDP Chart */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-center">GDP</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={chartData}
                          dataKey="gdp"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={25}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`gdp-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-border">
                {chartData.map((entry, index) => (
                  <div key={`legend-${index}`} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default EmpireStats;