import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  // Touch/pinch zoom states
  const [isTouch, setIsTouch] = useState(false);
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(1);
  const [touchCount, setTouchCount] = useState(0);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
    const owner = getCountryOwner(countryId);
    if (!owner) {
      onCountrySelect(countryId);
    }
  };

  // Zoom and pan handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const newZoom = Math.max(0.5, Math.min(5, zoom + (e.deltaY > 0 ? -zoomSpeed : zoomSpeed)));
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    setPan(prev => ({
      x: prev.x + deltaX / zoom,
      y: prev.y + deltaY / zoom
    }));
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(5, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.5, prev - 0.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Helper function to calculate distance between two touch points
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch event handlers for pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouch(true);
    setTouchCount(e.touches.length);
    
    if (e.touches.length === 2) {
      // Two fingers - start pinch zoom
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setInitialZoom(zoom);
      e.preventDefault();
    } else if (e.touches.length === 1) {
      // Single finger - start drag
      setIsDragging(true);
      setLastMousePos({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && initialPinchDistance > 0) {
      // Two fingers - pinch zoom
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistance;
      const newZoom = Math.max(0.5, Math.min(5, initialZoom * scale));
      setZoom(newZoom);
    } else if (e.touches.length === 1 && isDragging && !isTouch) {
      // Single finger - drag (only if not in pinch mode)
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastMousePos.x;
      const deltaY = touch.clientY - lastMousePos.y;
      
      setPan(prev => ({
        x: prev.x + deltaX / zoom,
        y: prev.y + deltaY / zoom
      }));
      
      setLastMousePos({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      // All fingers lifted
      setIsDragging(false);
      setIsTouch(false);
      setInitialPinchDistance(0);
      setTouchCount(0);
    } else if (e.touches.length === 1 && touchCount === 2) {
      // Went from 2 fingers to 1 finger
      setInitialPinchDistance(0);
      setTouchCount(1);
      // Start single finger drag
      setIsDragging(true);
      setLastMousePos({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
    }
  };

  useEffect(() => {
    if (!svgContent) return;

    console.log('GameMap: Updating country styles, players:', players);

    // Add click handlers and styling to all country paths
    const svgElement = document.getElementById('world-map-svg');
    if (!svgElement) return;

    const paths = svgElement.querySelectorAll('path[id]') as NodeListOf<SVGPathElement>;
    
    // Store event handlers for cleanup
    const eventHandlers = new Map<SVGPathElement, {
      mouseenter?: () => void;
      mouseleave?: () => void;
      click?: () => void;
    }>();
    
    const updateCountryStyles = () => {
      console.log('GameMap: Applying styles to', paths.length, 'countries');
      paths.forEach(path => {
        const countryId = path.id.toLowerCase();
        const owner = getCountryOwner(countryId);
        
        if (owner) {
          console.log(`GameMap: Country ${countryId} owned by ${owner.name} (${owner.color})`);
        }
        
        // Apply current styling based on ownership
        if (owner) {
          // Country is owned - apply player color
          path.style.fill = owner.color;
          path.style.stroke = 'hsl(var(--accent))';
          path.style.strokeWidth = '2';
          path.style.filter = `drop-shadow(0 0 4px ${owner.color})`;
          path.style.cursor = 'default';
          path.style.transition = 'all 0.2s ease';
        } else {
          // Country is unowned - apply default styling
          path.style.fill = 'hsl(var(--land))';
          path.style.stroke = 'hsl(var(--border))';
          path.style.strokeWidth = '1';
          path.style.cursor = 'pointer';
          path.style.transition = 'all 0.2s ease';
        }
      });
    };

    // Initial style application
    updateCountryStyles();
    
    paths.forEach(path => {
      const countryId = path.id.toLowerCase();
      const owner = getCountryOwner(countryId);
      const handlers: any = {};
      
      // Add hover effects for unowned countries only
      if (!owner) {
        const mouseEnterHandler = () => {
          path.style.fill = 'hsl(var(--primary-glow))';
          path.style.transform = 'scale(1.01)';
          path.style.transformOrigin = 'center';
          path.style.zIndex = '10';
        };
        
        const mouseLeaveHandler = () => {
          path.style.fill = 'hsl(var(--land))';
          path.style.transform = 'scale(1)';
          path.style.zIndex = 'auto';
        };
        
        path.addEventListener('mouseenter', mouseEnterHandler);
        path.addEventListener('mouseleave', mouseLeaveHandler);
        
        handlers.mouseenter = mouseEnterHandler;
        handlers.mouseleave = mouseLeaveHandler;
      }
      
      // Add click handler
      const clickHandler = () => handleCountryClick(countryId);
      path.addEventListener('click', clickHandler);
      handlers.click = clickHandler;
      
      eventHandlers.set(path, handlers);
    });

    // Cleanup function
    return () => {
      paths.forEach(path => {
        const handlers = eventHandlers.get(path);
        if (handlers?.mouseenter) {
          path.removeEventListener('mouseenter', handlers.mouseenter);
        }
        if (handlers?.mouseleave) {
          path.removeEventListener('mouseleave', handlers.mouseleave);
        }
        if (handlers?.click) {
          path.removeEventListener('click', handlers.click);
        }
      });
      eventHandlers.clear();
    };
  }, [svgContent, players, selectedCountries]);

  return (
    <Card className="w-full h-full bg-gradient-to-br from-ocean to-primary overflow-hidden">
      <div className="relative w-full h-full animate-map-zoom">
        {svgContent ? (
          <div 
            ref={mapContainerRef}
            className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              userSelect: 'none',
              touchAction: 'none' // Prevent default touch behaviors
            }}
          >
            <div
              id="world-map-container"
              className="w-full h-full transition-transform duration-200 ease-out"
              dangerouslySetInnerHTML={{ 
                __html: svgContent.replace('<svg', '<svg id="world-map-svg"')
              }}
              style={{
                background: 'linear-gradient(135deg, hsl(var(--ocean)), hsl(220 80% 35%))',
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center'
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-primary-foreground">Loading world map...</div>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomIn}
            className="w-10 h-10 p-0"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomOut}
            className="w-10 h-10 p-0"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetView}
            className="w-10 h-10 p-0"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Game UI Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 animate-strategic-fade-in">
            <p className="text-sm font-medium text-card-foreground">
              Current Turn: <span 
                className="font-bold" 
                style={{ color: players.find(p => p.name === currentPlayer)?.color || 'hsl(var(--accent))' }}
              >
                {currentPlayer}
              </span>
            </p>
          </div>
          
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 animate-strategic-fade-in">
            <p className="text-sm font-medium text-card-foreground">
              Countries Selected: <span className="text-primary font-bold">{selectedCountries.length}</span>
            </p>
          </div>
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-2 pointer-events-none">
          <p className="text-xs text-card-foreground">
            Zoom: {Math.round(zoom * 100)}%
          </p>
        </div>
      </div>
    </Card>
  );
};

export default GameMap;