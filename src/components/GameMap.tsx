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
  
  // Ultra-simple touch state with ref for immediate updates
  const [debugInfo, setDebugInfo] = useState('Ready for touch');
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Import the SVG content directly
    import('/src/assets/world-map.svg?raw')
      .then(module => setSvgContent(module.default))
      .catch(error => console.error('Error loading world map:', error));
  }, []);

  const getCountryOwner = (countryId: string) => {
    return players.find(player => 
      player.countries && 
      Array.isArray(player.countries) && 
      player.countries.includes(countryId)
    );
  };

  const getCountryStyle = (countryId: string) => {
    const owner = getCountryOwner(countryId);
    
    if (owner) {
      return {
        fill: owner.color,
        stroke: 'hsl(var(--border))',
        strokeWidth: '1',
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
    const newZoom = Math.max(0.3, Math.min(20, zoom + (e.deltaY > 0 ? -zoomSpeed : zoomSpeed)));
    
    // Get container bounds for relative positioning
    const container = mapContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      
      // Calculate mouse position relative to container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate world position under mouse cursor at current zoom
      const worldX = (mouseX - rect.width / 2 - pan.x) / zoom;
      const worldY = (mouseY - rect.height / 2 - pan.y) / zoom;
      
      // Calculate new pan to keep the world position under the same screen position
      const newPanX = mouseX - rect.width / 2 - worldX * newZoom;
      const newPanY = mouseY - rect.height / 2 - worldY * newZoom;
      
      setZoom(newZoom);
      setPan({
        x: newPanX,
        y: newPanY
      });
    } else {
      // Fallback to simple zoom if container ref is not available
      setZoom(newZoom);
    }
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
    setZoom(prev => Math.min(20, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.3, prev - 0.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Ultra-simple distance calculation
  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  // Use native DOM event listeners instead of React handlers
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touchCount = e.touches.length;
      setDebugInfo(`Native Touch Start: ${touchCount} finger(s)`);
      
      if (touchCount === 1) {
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setIsPanning(true);
      } else if (touchCount === 2) {
        const dist = getDistance(
          e.touches[0].clientX, e.touches[0].clientY,
          e.touches[1].clientX, e.touches[1].clientY
        );
        lastTouchRef.current = { x: dist, y: zoom };
        setIsZooming(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touchCount = e.touches.length;
      
      if (touchCount === 1) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const lastX = lastTouchRef.current.x;
        const lastY = lastTouchRef.current.y;
        const deltaX = currentX - lastX;
        const deltaY = currentY - lastY;
        
        setDebugInfo(`Native Pan: ${deltaX.toFixed(0)}, ${deltaY.toFixed(0)} | Pos: ${currentX.toFixed(0)}, ${currentY.toFixed(0)}`);
        
        setPan(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        
        lastTouchRef.current = { x: currentX, y: currentY };
      } else if (touchCount === 2) {
        const currentDist = getDistance(
          e.touches[0].clientX, e.touches[0].clientY,
          e.touches[1].clientX, e.touches[1].clientY
        );
        
        const initialDist = lastTouchRef.current.x;
        const initialZoom = lastTouchRef.current.y;
        const scale = currentDist / initialDist;
        const newZoom = Math.max(0.3, Math.min(20, initialZoom * scale));
        
        setDebugInfo(`Native Zoom: ${newZoom.toFixed(2)}x`);
        setZoom(newZoom);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setDebugInfo('Native Touch End');
      setIsPanning(false);
      setIsZooming(false);
      
      if (e.changedTouches.length === 1) {
        const target = e.target as Element;
        if (target && target.tagName === 'path' && target.id) {
          const countryId = target.id.toLowerCase();
          setDebugInfo(`Native Tap: ${countryId}`);
          handleCountryClick(countryId);
        }
      }
    };

    // Add native event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [zoom, handleCountryClick]);

  useEffect(() => {
    if (!svgContent) return;

    // Add CSS styles for countries directly to the document
    const styleElement = document.getElementById('map-country-styles') || document.createElement('style');
    styleElement.id = 'map-country-styles';
    
    let cssRules = `
      #world-map-svg {
        outline: none !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        shape-rendering: crispEdges !important;
        image-rendering: pixelated !important;
        image-rendering: -moz-crisp-edges !important;
        image-rendering: crisp-edges !important;
        -ms-interpolation-mode: nearest-neighbor !important;
      }
      #world-map-svg path {
        fill: #000000 !important;
        stroke: #ffffff !important;
        stroke-width: ${0.5 / zoom}px !important;
        cursor: pointer !important;
        transition: ${isDragging || isPanning || isZooming ? 'none !important' : 'fill 0.2s ease !important'};
        opacity: 1 !important;
        outline: none !important;
        shape-rendering: crispEdges !important;
        vector-effect: non-scaling-stroke !important;
      }
      #world-map-svg path:focus {
        outline: none !important;
      }
      #world-map-svg text {
        shape-rendering: crispEdges !important;
        text-rendering: geometricPrecision !important;
        vector-effect: non-scaling-stroke !important;
      }
    `;
    
    // Add specific rules for owned countries
    players.forEach(player => {
      if (player.countries && Array.isArray(player.countries)) {
        player.countries.forEach(countryId => {
          if (countryId && typeof countryId === 'string') {
            cssRules += `
              #world-map-svg path#${countryId.toUpperCase()} {
                fill: ${player.color} !important;
                stroke: none !important;
                stroke-width: 0 !important;
                cursor: default !important;
                filter: drop-shadow(0 0 4px ${player.color}) !important;
              }
            `;
          }
        });
      }
    });
    
    // Add white outlines for selected countries
    selectedCountries.forEach(countryId => {
      if (countryId && typeof countryId === 'string') {
        cssRules += `
          #world-map-svg path#${countryId.toUpperCase()} {
            stroke: white !important;
            stroke-width: 0.5px !important;
          }
        `;
      }
    });
    
    // Add hover effects for unowned countries
    const ownedCountries = players.flatMap(player => 
      (player.countries || []).filter(id => id && typeof id === 'string').map(id => id.toUpperCase())
    );
    cssRules += `
      #world-map-svg path:not(${ownedCountries.map(id => `#${id}`).join(', ')}):hover {
        fill: hsl(var(--primary-glow)) !important;
        transform: none !important;
        z-index: 1 !important;
      }
    `;
    
    styleElement.textContent = cssRules;
    if (!document.getElementById('map-country-styles')) {
      document.head.appendChild(styleElement);
    }

    // Add click handlers to all country paths
    const svgElement = document.getElementById('world-map-svg');
    if (!svgElement) return;

    const paths = svgElement.querySelectorAll('path[id]') as NodeListOf<SVGPathElement>;
    
    // Store event handlers for cleanup
    const eventHandlers = new Map<SVGPathElement, { click?: () => void }>();
    
    paths.forEach(path => {
      const countryId = path.id.toLowerCase();
      
      // Only add click handler - touch handling is done at container level
      const clickHandler = () => handleCountryClick(countryId);
      path.addEventListener('click', clickHandler);
      
      eventHandlers.set(path, { click: clickHandler });
    });

    // Cleanup function
    return () => {
      paths.forEach(path => {
        const handlers = eventHandlers.get(path);
        if (handlers?.click) {
          path.removeEventListener('click', handlers.click);
        }
      });
      eventHandlers.clear();
      
      // Remove the style element when component unmounts
      const styleEl = document.getElementById('map-country-styles');
      if (styleEl) {
        styleEl.remove();
      }
    };
  }, [svgContent, players, selectedCountries, zoom, isDragging, isPanning, isZooming]);

  return (
    <Card className="w-full h-full overflow-hidden" style={{ background: 'hsl(200 70% 85%)' }}>
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
            // Removed React touch handlers - using native DOM listeners instead
            style={{ 
              userSelect: 'none',
              touchAction: 'none'
            }}
          >
            <div
              id="world-map-container"
              className="w-full h-full"
              dangerouslySetInnerHTML={{ 
                __html: svgContent
                  .replace('<svg', `<svg id="world-map-svg" style="transform: translate(${pan.x}px, ${pan.y}px) scale(${zoom}); transform-origin: center; will-change: transform;"`)
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

        {/* Debug Info for Mobile */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="bg-red-500 text-white rounded-lg p-2 text-sm font-bold">
            {debugInfo}
          </div>
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
        <div className="absolute bottom-16 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-2 pointer-events-none">
          <p className="text-xs text-card-foreground">
            Zoom: {Math.round(zoom * 100)}%
          </p>
        </div>
      </div>
    </Card>
  );
};

export default GameMap;
