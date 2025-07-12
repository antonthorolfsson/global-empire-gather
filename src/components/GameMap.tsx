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
  const [initialPinchCenter, setInitialPinchCenter] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const lastTouchTime = useRef(0);
  const lastTouchPos = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Import the SVG content directly
    import('/src/assets/world-map.svg?raw')
      .then(module => setSvgContent(module.default))
      .catch(error => console.error('Error loading world map:', error));
  }, []);

  useEffect(() => {
    // Cleanup animation frame on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
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
    const newZoom = Math.max(0.5, Math.min(10, zoom + (e.deltaY > 0 ? -zoomSpeed : zoomSpeed)));
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
    setZoom(prev => Math.min(10, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.5, prev - 0.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Helper function to calculate center between two touch points
  const getTouchCenter = (touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  // Helper function to calculate distance between two touch points
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch event handlers for pinch zoom
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchMoved, setTouchMoved] = useState(false);
  
  // Momentum and smoothness for mobile
  useEffect(() => {
    if (!isAnimating) return;
    
    let animationId: number;
    const deceleration = 0.95;
    const minVelocity = 0.1;
    
    const animate = () => {
      setVelocity(prev => {
        const newVelocity = {
          x: prev.x * deceleration,
          y: prev.y * deceleration
        };
        
        if (Math.abs(newVelocity.x) < minVelocity && Math.abs(newVelocity.y) < minVelocity) {
          setIsAnimating(false);
          return { x: 0, y: 0 };
        }
        
        setPan(prevPan => ({
          x: prevPan.x + newVelocity.x,
          y: prevPan.y + newVelocity.y
        }));
        
        return newVelocity;
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isAnimating]);

  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('Touch start - fingers:', e.touches.length);
    setIsTouch(true);
    setTouchCount(e.touches.length);
    setTouchStartTime(Date.now());
    setTouchMoved(false);
    setIsAnimating(false); // Stop any ongoing momentum
    setVelocity({ x: 0, y: 0 });
    
    if (e.touches.length === 2) {
      // Two fingers - start pinch zoom
      const distance = getDistance(e.touches[0], e.touches[1]);
      const center = getTouchCenter(e.touches[0], e.touches[1]);
      
      setInitialPinchDistance(distance);
      setInitialZoom(zoom);
      setInitialPinchCenter(center);
      setInitialPan({ ...pan });
      e.preventDefault();
    } else if (e.touches.length === 1) {
      // Single finger - prepare for drag
      const touch = e.touches[0];
      setLastMousePos({ x: touch.clientX, y: touch.clientY });
      lastTouchTime.current = Date.now();
      lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance > 0) {
      // Two fingers - ultra-smooth pinch zoom
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const currentCenter = getTouchCenter(e.touches[0], e.touches[1]);
      
      // Smoother zoom scaling with better curve
      const rawScale = currentDistance / initialPinchDistance;
      const scale = Math.pow(rawScale, 0.9); // More linear feel
      const newZoom = Math.max(0.5, Math.min(10, initialZoom * scale));
      
      // Get container bounds for relative positioning
      const container = mapContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        
        // Calculate the center point relative to the container
        const centerX = currentCenter.x - rect.left;
        const centerY = currentCenter.y - rect.top;
        
        // Calculate world position under the pinch center at initial zoom
        const worldX = (centerX - rect.width / 2 - initialPan.x) / initialZoom;
        const worldY = (centerY - rect.height / 2 - initialPan.y) / initialZoom;
        
        // Calculate new pan to keep the world position under the same screen position
        const newPanX = centerX - rect.width / 2 - worldX * newZoom;
        const newPanY = centerY - rect.height / 2 - worldY * newZoom;
        
        setZoom(newZoom);
        setPan({
          x: newPanX,
          y: newPanY
        });
      } else {
        setZoom(newZoom);
      }
      
      if (!touchMoved) setTouchMoved(true);
    } else if (e.touches.length === 1 && initialPinchDistance === 0 && !isAnimating) {
      // Single finger - only pan if not in momentum animation
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastMousePos.x;
      const deltaY = touch.clientY - lastMousePos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Require minimum movement to start panning (reduces jitter)
      if (distance > 3) {
        if (!touchMoved) {
          setTouchMoved(true);
          setIsDragging(true);
        }
        e.preventDefault();
        
        // Throttle updates for smoother performance
        const now = Date.now();
        if (now - lastTouchTime.current > 16) { // ~60fps
          // Improved pan calculation for better mobile experience at high zoom
          const zoomFactor = Math.max(0.3, 1 / Math.sqrt(zoom)); // Less aggressive scaling
          const panDeltaX = deltaX * zoomFactor;
          const panDeltaY = deltaY * zoomFactor;
          
          setPan(prev => ({
            x: prev.x + panDeltaX,
            y: prev.y + panDeltaY
          }));
          
          // Simple velocity for momentum
          setVelocity({
            x: panDeltaX * 0.8,
            y: panDeltaY * 0.8
          });
          
          setLastMousePos({ x: touch.clientX, y: touch.clientY });
          lastTouchTime.current = now;
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    console.log('Touch end - touchMoved:', touchMoved, 'touchCount:', touchCount, 'touches:', e.touches.length);
    
    if (e.touches.length === 0) {
      // All fingers lifted
      const touchDuration = Date.now() - touchStartTime;
      console.log('Touch duration:', touchDuration, 'touchMoved:', touchMoved);
      
      // If it was a quick tap without movement, trigger country selection
      if (!touchMoved && touchDuration < 300 && touchCount === 1) {
        console.log('Quick tap detected, checking for country under touch');
        // Get the element under the original touch point
        const target = e.target as Element;
        if (target && target.tagName === 'path' && target.id) {
          const countryId = target.id.toLowerCase();
          console.log('Country tapped:', countryId);
          handleCountryClick(countryId);
        }
      } else if (touchMoved && touchCount === 1) {
        // Enable momentum for smooth deceleration
        const currentVelocity = velocity;
        const velocityMagnitude = Math.sqrt(currentVelocity.x * currentVelocity.x + currentVelocity.y * currentVelocity.y);
        
        if (velocityMagnitude > 1) { // Only start momentum if there's significant velocity
          setIsAnimating(true);
        }
      }
      
      // Reset all touch states
      setIsDragging(false);
      setIsTouch(false);
      setInitialPinchDistance(0);
      setTouchCount(0);
      setTouchMoved(false);
    } else if (e.touches.length === 1 && touchCount === 2) {
      // Went from 2 fingers to 1 finger
      setInitialPinchDistance(0);
      setTouchCount(1);
      setLastMousePos({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
      lastTouchTime.current = Date.now();
      lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  useEffect(() => {
    if (!svgContent) return;

    console.log('GameMap: Updating country styles, players:', players);
    
    // Debug player countries data
    players.forEach((player, index) => {
      console.log(`Player ${index + 1} (${player.name}):`, {
        countries: player.countries,
        color: player.color
      });
      
      // Debug specific countries
      if (player.countries && Array.isArray(player.countries)) {
        player.countries.forEach(countryId => {
          if (countryId && typeof countryId === 'string') {
            console.log(`  Country ${countryId} -> CSS selector: #world-map-svg path#${countryId.toUpperCase()}, Color: ${player.color}`);
          } else {
            console.log(`  Invalid country ID:`, countryId);
          }
        });
      }
    });

    // Add CSS styles for countries directly to the document
    const styleElement = document.getElementById('map-country-styles') || document.createElement('style');
    styleElement.id = 'map-country-styles';
    
    let cssRules = `
      #world-map-svg path {
        fill: #000000 !important;
        stroke: #ffffff !important;
        stroke-width: 0.5px !important;
        cursor: pointer !important;
        transition: ${isDragging || isTouch ? 'none !important' : 'all 0.2s ease !important'};
        opacity: 1 !important;
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
            stroke-width: 3px !important;
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
        transform: ${isDragging || isTouch ? 'none !important' : 'scale(1.01) !important'};
        transform-origin: center !important;
        z-index: 10 !important;
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
  }, [svgContent, players, selectedCountries]);

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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              userSelect: 'none',
              touchAction: 'none' // Prevent browser's default touch behaviors
            }}
          >
            <div
              id="world-map-container"
              className="w-full h-full"
              dangerouslySetInnerHTML={{ 
                __html: svgContent.replace('<svg', '<svg id="world-map-svg"')
              }}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center',
                transition: 'none',
                willChange: 'transform'
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