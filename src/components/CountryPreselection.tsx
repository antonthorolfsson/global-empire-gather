import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MapPin, Users, Zap, Factory, DollarSign, ChevronUp, ChevronDown, X, Clock } from 'lucide-react';
import { GAME_COUNTRIES, CountryData } from '@/data/gameCountries';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CountryPreselectionProps {
  onCountrySelect: (countryId: string) => void;
  selectedCountries: string[];
  isPlayerTurn: boolean;
  gameId: string;
  playerId: string;
}

const CountryPreselection = ({ onCountrySelect, selectedCountries, isPlayerTurn, gameId, playerId }: CountryPreselectionProps) => {
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [isPreselectionMode, setIsPreselectionMode] = useState<boolean>(() => {
    // Load from localStorage, default to false
    const saved = localStorage.getItem('preselectionMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [preselectionList, setPreselectionList] = useState<string[]>([]);
  const [autoSelectTimer, setAutoSelectTimer] = useState<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Load preselections from database on component mount
  useEffect(() => {
    const loadPreselections = async () => {
      if (!playerId || !gameId) return;
      
      console.log('Loading preselections for player:', playerId, 'game:', gameId);
      
      const { data, error } = await supabase
        .from('player_preselections')
        .select('country_id, position')
        .eq('player_id', playerId)
        .eq('game_id', gameId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error loading preselections:', error);
        return;
      }

      const loadedList = data.map(p => p.country_id);
      console.log('Loaded preselections:', loadedList);
      setPreselectionList(loadedList);
    };

    loadPreselections();
  }, [playerId, gameId]);

  // Save preselection mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('preselectionMode', JSON.stringify(isPreselectionMode));
  }, [isPreselectionMode]);

  // Save preselections to database whenever the list changes
  useEffect(() => {
    if (!playerId || !gameId) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const savePreselections = async () => {
      if (isSaving) return; // Skip if already saving
      
      setIsSaving(true);
      try {
        // Clear all existing preselections for this player first
        await supabase
          .from('player_preselections')
          .delete()
          .eq('player_id', playerId)
          .eq('game_id', gameId);

        // Insert new preselections if any exist
        if (preselectionList.length > 0) {
          const insertData = preselectionList.map((countryId, index) => ({
            player_id: playerId,
            game_id: gameId,
            country_id: countryId,
            position: index + 1
          }));

          const { error } = await supabase
            .from('player_preselections')
            .insert(insertData);

          if (error) {
            console.error('Error saving preselections:', error);
            // Don't show toast for constraint violations, just log them
            if (error.code !== '23505') {
              toast({
                title: "Error",
                description: "Failed to save preselection list",
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error saving preselections:', error);
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce saves with longer delay
    saveTimeoutRef.current = setTimeout(savePreselections, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [preselectionList, playerId, gameId, isSaving, toast]);

  // Auto-select logic when it's player's turn and preselection list has items
  useEffect(() => {
    if (isPlayerTurn && preselectionList.length > 0 && !autoSelectTimer) {
      const timer = setTimeout(() => {
        const firstCountry = preselectionList[0];
        if (firstCountry && !selectedCountries.includes(firstCountry)) {
          onCountrySelect(firstCountry);
          setPreselectionList(prev => prev.slice(1)); // Remove the selected country
        }
      }, 2000); // 2 second delay to give user time to react
      
      setAutoSelectTimer(timer);
    }

    return () => {
      if (autoSelectTimer) {
        clearTimeout(autoSelectTimer);
        setAutoSelectTimer(null);
      }
    };
  }, [isPlayerTurn, preselectionList, autoSelectTimer, selectedCountries, onCountrySelect]);

  // Remove countries from preselection list when they get selected by others
  useEffect(() => {
    setPreselectionList(prev => prev.filter(countryId => !selectedCountries.includes(countryId)));
  }, [selectedCountries]);

  // Filter out already selected countries
  const unselectedCountries = GAME_COUNTRIES.filter(
    country => !selectedCountries.includes(country.id)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleCountryClick = (countryId: string) => {
    if (isPreselectionMode) {
      // Add to preselection list if not already there
      if (!preselectionList.includes(countryId)) {
        setPreselectionList(prev => [...prev, countryId]);
      }
    } else {
      setSelectedCountryId(countryId);
    }
  };

  const handleSelectCountry = () => {
    if (selectedCountryId && isPlayerTurn) {
      onCountrySelect(selectedCountryId);
      setSelectedCountryId('');
    }
  };

  const handleRemoveFromPreselection = (countryId: string) => {
    setPreselectionList(prev => prev.filter(id => id !== countryId));
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newList = [...preselectionList];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      setPreselectionList(newList);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < preselectionList.length - 1) {
      const newList = [...preselectionList];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      setPreselectionList(newList);
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

      {/* Preselection Toggle */}
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="preselection-mode" className="text-sm font-medium">
              Preselection Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Queue countries for automatic selection
            </p>
          </div>
          <Switch
            id="preselection-mode"
            checked={isPreselectionMode}
            onCheckedChange={setIsPreselectionMode}
          />
        </div>
      </Card>

      {/* Auto-select warning */}
      {isPlayerTurn && preselectionList.length > 0 && autoSelectTimer && (
        <Card className="p-3 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2 text-orange-800">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Auto-selecting {GAME_COUNTRIES.find(c => c.id === preselectionList[0])?.name} in 2 seconds...
            </span>
          </div>
        </Card>
      )}

      {/* Preselection List */}
      {preselectionList.length > 0 && (
        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Preselection Queue</h3>
              <Badge variant="secondary" className="text-xs">
                {preselectionList.length} queued
              </Badge>
            </div>
            <div className="space-y-1">
              {preselectionList.map((countryId, index) => {
                const country = GAME_COUNTRIES.find(c => c.id === countryId);
                if (!country) return null;
                
                return (
                  <div key={countryId} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs px-1">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === preselectionList.length - 1}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveFromPreselection(countryId)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {!isPlayerTurn && (
        <Card className="p-3 bg-muted/30 border-orange-200">
          <p className="text-sm text-muted-foreground text-center">
            Wait for your turn to select a country
          </p>
        </Card>
      )}

      {/* Selected Country Details (only in manual mode) */}
      {!isPreselectionMode && selectedCountryData && (
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
        <div className="text-xs text-muted-foreground mb-2">
          {isPreselectionMode ? 'Click countries to add to queue' : 'Click to select for voting'}
        </div>
        
        {unselectedCountries.map((country) => {
          const isInPreselection = preselectionList.includes(country.id);
          const preselectionIndex = preselectionList.indexOf(country.id);
          
          return (
            <Card 
              key={country.id}
              className={`p-3 cursor-pointer transition-all hover:bg-muted/50 ${
                selectedCountryId === country.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : isInPreselection
                    ? 'ring-2 ring-green-500 bg-green-50'
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
                <div className="flex items-center gap-2">
                  {isInPreselection && (
                    <Badge variant="secondary" className="text-xs">
                      #{preselectionIndex + 1}
                    </Badge>
                  )}
                  {selectedCountryId === country.id && !isPreselectionMode && (
                    <Badge variant="secondary" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        
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