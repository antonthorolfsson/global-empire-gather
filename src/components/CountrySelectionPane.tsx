import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Users, MapPin, DollarSign, Building } from 'lucide-react';

interface Country {
  id: string;
  name: string;
  owner?: string;
  population: number;
  area: number;
  gdp: number;
  militarySize?: number;
  tanks?: number;
  aircraft?: number;
  navySize?: number;
  energyProduction?: number;
  oilProduction?: number;
  gasProduction?: number;
}

interface Player {
  id: string;
  name: string;
  countries: string[];
  color: string;
}

interface CountrySelectionPaneProps {
  countries: Country[];
  onCountrySelect: (countryId: string) => void;
  currentPlayer: string;
  players: Player[];
}

const CountrySelectionPane: React.FC<CountrySelectionPaneProps> = ({
  countries,
  onCountrySelect,
  currentPlayer,
  players
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'population' | 'gdp' | 'area'>('name');

  const availableCountries = useMemo(() => {
    const owned = players.flatMap(player => player.countries || []);
    return countries.filter(country => !owned.includes(country.id));
  }, [countries, players]);

  const filteredCountries = useMemo(() => {
    let filtered = availableCountries.filter(country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'population':
          return b.population - a.population;
        case 'gdp':
          return b.gdp - a.gdp;
        case 'area':
          return b.area - a.area;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [availableCountries, searchTerm, sortBy]);

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Available Countries
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <div className="flex gap-1">
            {[
              { key: 'name', label: 'Name' },
              { key: 'population', label: 'Population' },
              { key: 'gdp', label: 'GDP' },
              { key: 'area', label: 'Area' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={sortBy === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(key as typeof sortBy)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {filteredCountries.map((country) => (
              <Card
                key={country.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary/20 hover:border-l-primary/60"
                onClick={() => onCountrySelect(country.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">{country.name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{formatNumber(country.population)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">${formatNumber(country.gdp)}B</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{formatNumber(country.area)}km²</span>
                        </div>
                        {country.militarySize && (
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {formatNumber(country.militarySize)} troops
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredCountries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No countries match your search.' : 'All countries have been selected.'}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CountrySelectionPane;