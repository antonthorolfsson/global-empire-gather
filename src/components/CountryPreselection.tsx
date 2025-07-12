import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Zap, Factory, DollarSign } from 'lucide-react';
import { GAME_COUNTRIES, CountryData } from '@/data/gameCountries';

interface CountryPreselectionProps {
  onCountrySelect: (countryId: string) => void;
  selectedCountries: string[];
  isPlayerTurn: boolean;
}

const CountryPreselection = ({ onCountrySelect, selectedCountries, isPlayerTurn }: CountryPreselectionProps) => {
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');

  // Filter out already selected countries
  const unselectedCountries = GAME_COUNTRIES.filter(
    country => !selectedCountries.includes(country.id)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleCountryClick = (countryId: string) => {
    setSelectedCountryId(countryId);
  };

  const handleSelectCountry = () => {
    if (selectedCountryId && isPlayerTurn) {
      onCountrySelect(selectedCountryId);
      setSelectedCountryId('');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const selectedCountryData = selectedCountryId ? 
    GAME_COUNTRIES.find(c => c.id === selectedCountryId) : null;

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Country Selection
        </h2>
        <Badge variant="outline">
          {unselectedCountries.length} available
        </Badge>
      </div>

      {!isPlayerTurn && (
        <Card className="p-3 bg-muted/30 border-orange-200">
          <p className="text-sm text-muted-foreground text-center">
            Wait for your turn to select a country
          </p>
        </Card>
      )}

      {/* Selected Country Details */}
      {selectedCountryData && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{selectedCountryData.name}</h3>
              <Button 
                onClick={handleSelectCountry}
                disabled={!isPlayerTurn}
                size="sm"
                className="gap-1"
              >
                <Zap className="w-4 h-4" />
                Select
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{formatNumber(selectedCountryData.population)}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span>${selectedCountryData.gdp}B</span>
              </div>
              <div className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-muted-foreground" />
                <span>{formatNumber(selectedCountryData.militarySize)}</span>
              </div>
              <div className="text-muted-foreground text-xs">
                {formatNumber(selectedCountryData.area)} km²
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Countries List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {unselectedCountries.map((country) => (
          <Card 
            key={country.id}
            className={`p-3 cursor-pointer transition-all hover:bg-muted/50 ${
              selectedCountryId === country.id 
                ? 'ring-2 ring-primary bg-primary/5' 
                : ''
            }`}
            onClick={() => handleCountryClick(country.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{country.name}</h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {formatNumber(country.population)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${country.gdp}B
                  </span>
                  <span className="flex items-center gap-1">
                    <Factory className="w-3 h-3" />
                    {formatNumber(country.militarySize)}
                  </span>
                </div>
              </div>
              {selectedCountryId === country.id && (
                <Badge variant="secondary" className="text-xs">
                  Selected
                </Badge>
              )}
            </div>
          </Card>
        ))}
        
        {unselectedCountries.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">All countries have been selected!</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CountryPreselection;