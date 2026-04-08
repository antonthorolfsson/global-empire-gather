import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, MapPin } from 'lucide-react';

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
  // viewCenter is in SVG coordinate space (the point at the center of the viewport)
  const [viewCenter, setViewCenter] = useState({ x: 504.836, y: 332.982 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  // Touch/pinch zoom states
  const [isTouch, setIsTouch] = useState(false);
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(1);
  const [touchCount, setTouchCount] = useState(0);
  const [initialPinchCenter, setInitialPinchCenter] = useState({ x: 0, y: 0 });
  const [initialViewCenter, setInitialViewCenter] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const lastTouchTime = useRef(0);
  const lastTouchPos = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const svgDimsRef = useRef({ width: 1009.6727, height: 665.96301 });

  // Helper: get base fit scale (how many pixels per SVG unit at zoom=1)
  const getBaseFitScale = () => {
    const container = mapContainerRef.current;
    if (!container) return 1;
    const rect = container.getBoundingClientRect();
    const { width: origW, height: origH } = svgDimsRef.current;
    return Math.min(rect.width / origW, rect.height / origH);
  };

  useEffect(() => {
    // Import the SVG content directly and normalize it for crisp rendering
    import('/src/assets/world-map.svg?raw')
      .then(module => {
        if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
          setSvgContent(module.default);
          return;
        }

        const parser = new DOMParser();
        const documentFragment = parser.parseFromString(module.default, 'image/svg+xml');
        const svgElement = documentFragment.documentElement as SVGSVGElement | null;

        if (!svgElement || svgElement.tagName.toLowerCase() !== 'svg') {
          setSvgContent(module.default);
          return;
        }

        const originalWidth = parseFloat(svgElement.getAttribute('width') || '1009.6727');
        const originalHeight = parseFloat(svgElement.getAttribute('height') || '665.96301');

        svgDimsRef.current = { width: originalWidth, height: originalHeight };
        setViewCenter({ x: originalWidth / 2, y: originalHeight / 2 });

        svgElement.setAttribute('id', 'world-map-svg');
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');
        svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        if (!svgElement.getAttribute('viewBox')) {
          svgElement.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
        }

        svgElement.setAttribute('shape-rendering', 'geometricPrecision');
        svgElement.setAttribute('text-rendering', 'geometricPrecision');
        svgElement.setAttribute('image-rendering', 'crisp-edges');
        svgElement.setAttribute(
          'style',
          'image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; shape-rendering: geometricPrecision; text-rendering: geometricPrecision;'
        );

        const paths = svgElement.querySelectorAll<SVGPathElement>('path');
        paths.forEach(path => {
          path.setAttribute('vector-effect', 'non-scaling-stroke');
          path.setAttribute('shape-rendering', 'geometricPrecision');
        });

        if (typeof XMLSerializer === 'undefined') {
          setSvgContent(svgElement.outerHTML);
          return;
        }

        const serializer = new XMLSerializer();
        setSvgContent(serializer.serializeToString(svgElement));
      })
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

  // Update SVG viewBox for crisp vector rendering at any zoom level
  useEffect(() => {
    const svgElement = document.getElementById('world-map-svg');
    if (!svgElement) return;
    const { width: origW, height: origH } = svgDimsRef.current;
    const vbW = origW / zoom;
    const vbH = origH / zoom;
    const vbX = viewCenter.x - vbW / 2;
    const vbY = viewCenter.y - vbH / 2;
    svgElement.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
  }, [zoom, viewCenter, svgContent]);



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
    const zoomFactor = 1.2;
    const newZoom = Math.max(0.5, Math.min(10, e.deltaY > 0 ? zoom / zoomFactor : zoom * zoomFactor));
    
    const container = mapContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const { width: origW, height: origH } = svgDimsRef.current;
      const bfs = Math.min(rect.width / origW, rect.height / origH);
      const offsetX = (rect.width - origW * bfs) / 2;
      const offsetY = (rect.height - origH * bfs) / 2;
      
      // Mouse position in base SVG coords (unzoomed)
      const msX = (e.clientX - rect.left - offsetX) / bfs;
      const msY = (e.clientY - rect.top - offsetY) / bfs;
      
      // SVG world point under cursor at current zoom
      const svgX = viewCenter.x - origW / (2 * zoom) + msX / zoom;
      const svgY = viewCenter.y - origH / (2 * zoom) + msY / zoom;
      
      // Keep that world point under cursor at new zoom
      setViewCenter({
        x: svgX + origW / (2 * newZoom) - msX / newZoom,
        y: svgY + origH / (2 * newZoom) - msY / newZoom,
      });
    }
    
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
    const bfs = getBaseFitScale();
    
    // Dragging right means moving the view left (negative delta in SVG space)
    setViewCenter(prev => ({
      x: prev.x - deltaX / (bfs * zoom),
      y: prev.y - deltaY / (bfs * zoom),
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
    const { width, height } = svgDimsRef.current;
    setViewCenter({ x: width / 2, y: height / 2 });
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
    const minVelocity = 0.0001;
    
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
        
        setViewCenter(prevCenter => ({
          x: prevCenter.x + newVelocity.x,
          y: prevCenter.y + newVelocity.y
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
    setIsTouch(true);
    setTouchCount(e.touches.length);
    setTouchStartTime(Date.now());
    setTouchMoved(false);
    setIsAnimating(false);
    setVelocity({ x: 0, y: 0 });
    
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      const center = getTouchCenter(e.touches[0], e.touches[1]);
      
      setInitialPinchDistance(distance);
      setInitialZoom(zoom);
      setInitialPinchCenter(center);
      setInitialViewCenter({ ...viewCenter });
      e.preventDefault();
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setLastMousePos({ x: touch.clientX, y: touch.clientY });
      lastTouchTime.current = Date.now();
      lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance > 0) {
      // Two fingers - pinch zoom via viewBox
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const currentCenter = getTouchCenter(e.touches[0], e.touches[1]);
      
      const rawScale = currentDistance / initialPinchDistance;
      const scale = Math.pow(rawScale, 0.9);
      const newZoom = Math.max(0.5, Math.min(10, initialZoom * scale));
      
      const container = mapContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const { width: origW, height: origH } = svgDimsRef.current;
        const bfs = Math.min(rect.width / origW, rect.height / origH);
        const offsetX = (rect.width - origW * bfs) / 2;
        const offsetY = (rect.height - origH * bfs) / 2;
        
        // Initial pinch center in base SVG coords
        const pcX = (initialPinchCenter.x - rect.left - offsetX) / bfs;
        const pcY = (initialPinchCenter.y - rect.top - offsetY) / bfs;
        
        // SVG world point that was at the initial pinch center
        const svgX = initialViewCenter.x - origW / (2 * initialZoom) + pcX / initialZoom;
        const svgY = initialViewCenter.y - origH / (2 * initialZoom) + pcY / initialZoom;
        
        // Current pinch center in base SVG coords
        const curPcX = (currentCenter.x - rect.left - offsetX) / bfs;
        const curPcY = (currentCenter.y - rect.top - offsetY) / bfs;
        
        // Keep the SVG point under the current pinch center at new zoom
        setViewCenter({
          x: svgX + origW / (2 * newZoom) - curPcX / newZoom,
          y: svgY + origH / (2 * newZoom) - curPcY / newZoom,
        });
      }
      
      setZoom(newZoom);
      if (!touchMoved) setTouchMoved(true);
    } else if (e.touches.length === 1 && initialPinchDistance === 0 && !isAnimating) {
      // Single finger - pan
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastMousePos.x;
      const deltaY = touch.clientY - lastMousePos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > 3) {
        if (!touchMoved) {
          setTouchMoved(true);
          setIsDragging(true);
        }
        e.preventDefault();
        
        const now = Date.now();
        if (now - lastTouchTime.current > 16) {
          const bfs = getBaseFitScale();
          const svgDeltaX = deltaX / (bfs * zoom);
          const svgDeltaY = deltaY / (bfs * zoom);
          
          setViewCenter(prev => ({
            x: prev.x - svgDeltaX,
            y: prev.y - svgDeltaY,
          }));
          
          // Velocity in SVG units for momentum
          setVelocity({
            x: -svgDeltaX * 0.8,
            y: -svgDeltaY * 0.8,
          });
          
          setLastMousePos({ x: touch.clientX, y: touch.clientY });
          lastTouchTime.current = now;
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      const touchDuration = Date.now() - touchStartTime;
      
      if (!touchMoved && touchDuration < 300 && touchCount === 1) {
        const target = e.target as Element;
        if (target && target.tagName === 'path' && target.id) {
          const countryId = target.id.toLowerCase();
          handleCountryClick(countryId);
        }
      } else if (touchMoved && touchCount === 1) {
        const currentVelocity = velocity;
        const velocityMagnitude = Math.sqrt(currentVelocity.x * currentVelocity.x + currentVelocity.y * currentVelocity.y);
        
        if (velocityMagnitude > 0.01) {
          setIsAnimating(true);
        }
      }
      
      setIsDragging(false);
      setIsTouch(false);
      setInitialPinchDistance(0);
      setTouchCount(0);
      setTouchMoved(false);
    } else if (e.touches.length === 1 && touchCount === 2) {
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
    <Card className="w-full overflow-hidden md:h-full h-[70vh]" style={{ background: 'hsl(200 70% 85%)' }}>
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
                __html: svgContent
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