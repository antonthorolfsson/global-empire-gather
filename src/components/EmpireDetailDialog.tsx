import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, Map, Flag, Crown, Target } from 'lucide-react';
import { Player, Country } from '@/hooks/useGameState';

interface EmpireDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player | null;
  countries: Country[];
  players: Player[];
}

const EmpireDetailDialog: React.FC<EmpireDetailDialogProps> = ({
  open,
  onOpenChange,
  player,
  countries,
  players
}) => {
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
  const rank = allPlayerStats.findIndex(p => p.playerId === player.id) + 1;

  const formatNumber = (num: number) => {
    if (isNaN(num) || num == null || !isFinite(num)) return '0';
    if (num >= 1000000000000) return `${(num / 1000000000000).toFixed(1)}T`;
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatGDP = (gdpInBillions: number) => {
    const actualGDP = gdpInBillions * 1000000000;
    return formatNumber(actualGDP);
  };

  const getRankIcon = (rank: number) => {
    const icons = ['👑', '🥈', '🥉', '🎖️'];
    return icons[rank - 1] || '🏅';
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-empire-gold text-empire-gold-foreground';
      case 2: return 'bg-empire-silver text-foreground';
      case 3: return 'bg-empire-bronze text-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCountryFlag = (countryId: string) => {
    // Convert country codes to flag emojis
    const flagMap: { [key: string]: string } = {
      'us': '🇺🇸', 'cn': '🇨🇳', 'jp': '🇯🇵', 'de': '🇩🇪', 'in': '🇮🇳', 'gb': '🇬🇧',
      'fr': '🇫🇷', 'it': '🇮🇹', 'br': '🇧🇷', 'ca': '🇨🇦', 'ru': '🇷🇺', 'kr': '🇰🇷',
      'au': '🇦🇺', 'es': '🇪🇸', 'mx': '🇲🇽', 'id': '🇮🇩', 'nl': '🇳🇱', 'ch': '🇨🇭',
      'tr': '🇹🇷', 'be': '🇧🇪', 'ie': '🇮🇪', 'at': '🇦🇹', 'il': '🇮🇱', 'no': '🇳🇴',
      'se': '🇸🇪', 'pl': '🇵🇱', 'dk': '🇩🇰', 'fi': '🇫🇮', 'pt': '🇵🇹', 'gr': '🇬🇷',
      'cz': '🇨🇿', 'ro': '🇷🇴', 'hu': '🇭🇺', 'bg': '🇧🇬', 'hr': '🇭🇷', 'sk': '🇸🇰',
      'si': '🇸🇮', 'lt': '🇱🇹', 'lv': '🇱🇻', 'ee': '🇪🇪', 'sa': '🇸🇦', 'ae': '🇦🇪',
      'eg': '🇪🇬', 'za': '🇿🇦', 'ng': '🇳🇬', 'ma': '🇲🇦', 'ke': '🇰🇪', 'gh': '🇬🇭',
      'et': '🇪🇹', 'tn': '🇹🇳', 'ly': '🇱🇾', 'dz': '🇩🇿', 'th': '🇹🇭', 'sg': '🇸🇬',
      'my': '🇲🇾', 'ph': '🇵🇭', 'vn': '🇻🇳', 'bd': '🇧🇩', 'pk': '🇵🇰', 'lk': '🇱🇰',
      'np': '🇳🇵', 'mm': '🇲🇲', 'kh': '🇰🇭', 'la': '🇱🇦', 'ar': '🇦🇷', 'cl': '🇨🇱',
      'pe': '🇵🇪', 'co': '🇨🇴', 've': '🇻🇪', 'ec': '🇪🇨', 'uy': '🇺🇾', 'py': '🇵🇾',
      'bo': '🇧🇴', 'nz': '🇳🇿', 'is': '🇮🇸', 'mt': '🇲🇹', 'cy': '🇨🇾', 'lu': '🇱🇺',
      'ad': '🇦🇩', 'mc': '🇲🇨', 'sm': '🇸🇲', 'va': '🇻🇦', 'li': '🇱🇮'
    };
    return flagMap[countryId] || '🏳️';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div 
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: player.color }}
            />
            <div>
              <DialogTitle className="text-xl font-bold text-primary">
                {player.name}'s Empire
              </DialogTitle>
              <DialogDescription>
                Detailed empire statistics and territories
              </DialogDescription>
            </div>
            <Badge 
              className={`${getRankColor(rank)} text-sm font-bold px-3 py-1 ml-auto`}
              variant="secondary"
            >
              #{rank} {getRankIcon(rank)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Empire Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Empire Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{playerCountries.length}</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formatNumber(totalPopulation)}</div>
                <div className="text-sm text-muted-foreground">Population</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{formatNumber(totalArea)} km²</div>
                <div className="text-sm text-muted-foreground">Land Area</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">${formatGDP(totalGDP)}</div>
                <div className="text-sm text-muted-foreground">GDP</div>
              </div>
            </CardContent>
          </Card>

          {/* Military Strength */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛡️ Military Strength
              </CardTitle>
              <CardDescription>
                Combined military capabilities across all territories
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {formatNumber(playerCountries.reduce((sum, c) => sum + (c.militarySize || 0), 0))}
                </div>
                <div className="text-sm text-muted-foreground">Active Personnel</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {formatNumber(playerCountries.reduce((sum, c) => sum + (c.tanks || 0), 0))}
                </div>
                <div className="text-sm text-muted-foreground">Tanks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {formatNumber(playerCountries.reduce((sum, c) => sum + (c.aircraft || 0), 0))}
                </div>
                <div className="text-sm text-muted-foreground">Aircraft</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {formatNumber(playerCountries.reduce((sum, c) => sum + (c.navySize || 0), 0))}
                </div>
                <div className="text-sm text-muted-foreground">Naval Vessels</div>
              </div>
            </CardContent>
          </Card>

          {/* Resource Production */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚡ Resource Production
              </CardTitle>
              <CardDescription>
                Annual production capacity across all territories
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {formatNumber(playerCountries.reduce((sum, c) => sum + (c.energyProduction || 0), 0))}
                </div>
                <div className="text-sm text-muted-foreground">TWh Energy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {playerCountries.reduce((sum, c) => sum + (c.oilProduction || 0), 0).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Million barrels/day Oil</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {formatNumber(playerCountries.reduce((sum, c) => sum + (c.gasProduction || 0), 0))}
                </div>
                <div className="text-sm text-muted-foreground">BCM Natural Gas</div>
              </div>
            </CardContent>
          </Card>

          {/* Territories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-primary" />
                Territories ({playerCountries.length})
              </CardTitle>
              <CardDescription>
                Countries under {player.name}'s control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {playerCountries
                  .sort((a, b) => (b.gdp || 0) - (a.gdp || 0))
                  .map((country) => (
                    <div 
                      key={country.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg">{getCountryFlag(country.id)}</div>
                        <div>
                          <div className="font-medium text-card-foreground">{country.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(country.population || 0)} people
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-accent">
                          ${formatGDP(country.gdp || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(country.area || 0)} km²
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Cultural Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🕌 Cultural & Demographics
              </CardTitle>
              <CardDescription>
                Religious, linguistic and demographic composition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Religions */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Major Religions</h4>
                <div className="space-y-2">
                  {playerCountries[0]?.religions?.slice(0, 3).map((religion, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{religion.name}</span>
                      <span className="text-sm font-medium">{religion.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Languages */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Main Languages</h4>
                <div className="space-y-2">
                  {playerCountries[0]?.languages?.slice(0, 3).map((language, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{language.name}</span>
                      <span className="text-sm font-medium">{language.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Demographics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{playerCountries[0]?.demographics?.urbanPopulation || 0}%</div>
                  <div className="text-xs text-muted-foreground">Urban Population</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{playerCountries[0]?.demographics?.literacyRate || 0}%</div>
                  <div className="text-xs text-muted-foreground">Literacy Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Empire Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Empire Score Breakdown
              </CardTitle>
              <CardDescription>
                How your empire score is calculated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Population Score (÷1M)</span>
                <span className="font-medium">{formatNumber(Math.round(totalPopulation / 1000000))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Territory Score (÷10K km²)</span>
                <span className="font-medium">{formatNumber(Math.round(totalArea / 10000))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Economic Score (GDP)</span>
                <span className="font-medium">{formatNumber(Math.round(totalGDP))}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total Empire Score</span>
                <span className="text-accent">
                  {formatNumber(Math.round((totalPopulation / 1000000) + (totalArea / 10000) + totalGDP))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmpireDetailDialog;