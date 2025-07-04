import React from 'react';
import { Card } from '@/components/ui/card';

interface Country {
  id: string;
  name: string;
  owner?: string;
  population: number;
  area: number; // in sq km
  gdp: number; // in billions USD
}

interface GameMapProps {
  countries: Country[];
  onCountrySelect: (countryId: string) => void;
  currentPlayer: string;
  selectedCountries: string[];
}

// Simplified world map data for prototype
const WORLD_MAP_COUNTRIES = [
  { id: 'us', name: 'United States', population: 331900000, area: 9833517, gdp: 23315, x: 180, y: 120 },
  { id: 'ca', name: 'Canada', population: 38010000, area: 9984670, gdp: 1736, x: 160, y: 80 },
  { id: 'mx', name: 'Mexico', population: 128900000, area: 1964375, gdp: 1293, x: 140, y: 180 },
  { id: 'br', name: 'Brazil', population: 215300000, area: 8514877, gdp: 1869, x: 250, y: 280 },
  { id: 'ar', name: 'Argentina', population: 45380000, area: 2780400, gdp: 449, x: 230, y: 350 },
  { id: 'uk', name: 'United Kingdom', population: 67220000, area: 243610, gdp: 2827, x: 380, y: 100 },
  { id: 'fr', name: 'France', population: 67750000, area: 551695, gdp: 2603, x: 390, y: 120 },
  { id: 'de', name: 'Germany', population: 83190000, area: 357022, gdp: 3846, x: 400, y: 110 },
  { id: 'ru', name: 'Russia', population: 146200000, area: 17098242, gdp: 1834, x: 480, y: 90 },
  { id: 'cn', name: 'China', population: 1412000000, area: 9596960, gdp: 14723, x: 550, y: 140 },
  { id: 'in', name: 'India', population: 1380000000, area: 3287263, gdp: 2875, x: 520, y: 180 },
  { id: 'jp', name: 'Japan', population: 125800000, area: 377944, gdp: 4231, x: 600, y: 150 },
  { id: 'au', name: 'Australia', population: 25690000, area: 7692024, gdp: 1393, x: 600, y: 280 },
  { id: 'za', name: 'South Africa', population: 60420000, area: 1221037, gdp: 419, x: 420, y: 300 },
  { id: 'eg', name: 'Egypt', population: 104300000, area: 1001449, gdp: 404, x: 410, y: 200 },
];

const GameMap: React.FC<GameMapProps> = ({ 
  countries, 
  onCountrySelect, 
  currentPlayer, 
  selectedCountries 
}) => {
  const getCountryColor = (countryId: string) => {
    if (selectedCountries.includes(countryId)) {
      return 'fill-empire-gold stroke-accent animate-empire-glow';
    }
    return 'fill-land stroke-border hover:fill-primary-glow transition-colors duration-200';
  };

  const handleCountryClick = (countryId: string) => {
    if (!selectedCountries.includes(countryId)) {
      onCountrySelect(countryId);
    }
  };

  return (
    <Card className="w-full h-full bg-gradient-to-br from-ocean to-primary overflow-hidden">
      <div className="relative w-full h-full animate-map-zoom">
        <svg 
          viewBox="0 0 800 400" 
          className="w-full h-full"
          style={{ background: 'linear-gradient(135deg, hsl(var(--ocean)), hsl(220 80% 35%))' }}
        >
          {/* Ocean background with decorative patterns */}
          <defs>
            <pattern id="waves" x="0" y="0" width="50" height="20" patternUnits="userSpaceOnUse">
              <path 
                d="M0,10 Q12.5,0 25,10 T50,10" 
                fill="none" 
                stroke="hsl(var(--primary-glow))" 
                strokeWidth="0.5" 
                opacity="0.3"
              />
            </pattern>
          </defs>
          
          <rect width="800" height="400" fill="url(#waves)" />

          {/* Countries */}
          {WORLD_MAP_COUNTRIES.map((country) => (
            <g key={country.id}>
              {/* Country circle representation */}
              <circle
                cx={country.x}
                cy={country.y}
                r={Math.sqrt(country.area / 100000) + 8} // Size based on area
                className={`${getCountryColor(country.id)} cursor-pointer hover:animate-country-select`}
                onClick={() => handleCountryClick(country.id)}
              />
              
              {/* Country label */}
              <text
                x={country.x}
                y={country.y + Math.sqrt(country.area / 100000) + 20}
                textAnchor="middle"
                className="fill-primary-foreground text-xs font-medium pointer-events-none"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
              >
                {country.name}
              </text>
            </g>
          ))}

          {/* Decorative elements */}
          <g opacity="0.6">
            {/* Trade routes */}
            <path 
              d="M180,120 Q300,100 400,110" 
              fill="none" 
              stroke="hsl(var(--accent))" 
              strokeWidth="2" 
              strokeDasharray="5,5"
              opacity="0.4"
            />
            <path 
              d="M400,110 Q500,120 550,140" 
              fill="none" 
              stroke="hsl(var(--accent))" 
              strokeWidth="2" 
              strokeDasharray="5,5"
              opacity="0.4"
            />
          </g>
        </svg>

        {/* Game UI Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 animate-strategic-fade-in">
            <p className="text-sm font-medium text-card-foreground">
              Current Turn: <span className="text-accent font-bold">{currentPlayer}</span>
            </p>
          </div>
          
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 animate-strategic-fade-in">
            <p className="text-sm font-medium text-card-foreground">
              Countries Selected: <span className="text-primary font-bold">{selectedCountries.length}</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GameMap;