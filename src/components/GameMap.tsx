import React, { useEffect, useState } from 'react';
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
  players: Array<{ id: string; name: string; countries: string[]; color: string }>;
}

const GameMap: React.FC<GameMapProps> = ({ 
  countries, 
  onCountrySelect, 
  currentPlayer, 
  selectedCountries,
  players
}) => {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    // Import the SVG content directly
    import('/src/assets/world-map.svg?raw')
      .then(module => setSvgContent(module.default))
      .catch(error => console.error('Error loading world map:', error));
  }, []);

  const getCountryOwner = (countryId: string) => {
    return players.find(player => player.countries.includes(countryId));
  };

  const getCountryStyle = (countryId: string) => {
    const owner = getCountryOwner(countryId);
    
    if (owner) {
      return {
        fill: owner.color,
        stroke: 'hsl(var(--accent))',
        strokeWidth: '2',
        filter: `drop-shadow(0 0 4px ${owner.color})`,
        cursor: 'default'
      };
    }
    
    return {
      fill: 'hsl(var(--land))',
      stroke: 'hsl(var(--border))',
      strokeWidth: '1',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    };
  };

  const handleCountryClick = (countryId: string) => {
    if (!selectedCountries.includes(countryId)) {
      onCountrySelect(countryId);
    }
  };

  useEffect(() => {
    if (!svgContent) return;

    // Add click handlers and styling to all country paths
    const svgElement = document.getElementById('world-map-svg');
    if (!svgElement) return;

    const paths = svgElement.querySelectorAll('path[id]') as NodeListOf<SVGPathElement>;
    
    paths.forEach(path => {
      const countryId = path.id.toLowerCase();
      
      // Apply initial styling
      const style = getCountryStyle(countryId);
      Object.assign(path.style, style);
      
      // Add hover effects for unselected countries
      const owner = getCountryOwner(countryId);
      if (!owner) {
        path.addEventListener('mouseenter', () => {
          path.style.fill = 'hsl(var(--primary-glow))';
          path.style.transform = 'scale(1.02)';
          path.style.transformOrigin = 'center';
        });
        
        path.addEventListener('mouseleave', () => {
          path.style.fill = 'hsl(var(--land))';
          path.style.transform = 'scale(1)';
        });
      }
      
      // Add click handler
      path.addEventListener('click', () => handleCountryClick(countryId));
    });

    // Cleanup function
    return () => {
      paths.forEach(path => {
        path.removeEventListener('mouseenter', () => {});
        path.removeEventListener('mouseleave', () => {});
        path.removeEventListener('click', () => {});
      });
    };
  }, [svgContent, selectedCountries, players, onCountrySelect]);

  return (
    <Card className="w-full h-full bg-gradient-to-br from-ocean to-primary overflow-hidden">
      <div className="relative w-full h-full animate-map-zoom">
        {svgContent ? (
          <div 
            id="world-map-container"
            className="w-full h-full"
            dangerouslySetInnerHTML={{ 
              __html: svgContent.replace('<svg', '<svg id="world-map-svg"')
            }}
            style={{
              background: 'linear-gradient(135deg, hsl(var(--ocean)), hsl(220 80% 35%))'
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-primary-foreground">Loading world map...</div>
          </div>
        )}

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