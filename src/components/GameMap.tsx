import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
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
  // State for React rendering (zoom indicator, reset)
  const [zoom, setZoom] = useState(1);
  const [viewCenter, setViewCenter] = useState({ x: 504.836, y: 332.982 });

  // Refs for synchronous access in event handlers (avoids React batching issues on mobile)
  const zoomRef = useRef(1);
  const viewCenterRef = useRef({ x: 504.836, y: 332.982 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const isTouchRef = useRef(false);
  const initialPinchDistanceRef = useRef(0);
  const initialZoomRef = useRef(1);
  const initialPinchCenterRef = useRef({ x: 0, y: 0 });
  const initialViewCenterRef = useRef({ x: 0, y: 0 });
  const touchCountRef = useRef(0);
  const touchMovedRef = useRef(false);
  const touchStartTimeRef = useRef(0);
  const velocityRef = useRef({ x: 0, y: 0 });
  const isAnimatingRef = useRef(false);
  const lastTouchTime = useRef(0);
  const lastTouchPos = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const svgDimsRef = useRef({ width: 1009.6727, height: 665.96301 });

  // Imperative viewBox update for immediate visual feedback
  const updateViewBox = useCallback((z?: number, vc?: { x: number; y: number }) => {
    const svgElement = document.getElementById('world-map-svg');
    if (!svgElement) return;
    const { width: origW, height: origH } = svgDimsRef.current;
    const curZ = z ?? zoomRef.current;
    const curVC = vc ?? viewCenterRef.current;
    const vbW = origW / curZ;
    const vbH = origH / curZ;
    const vbX = curVC.x - vbW / 2;
    const vbY = curVC.y - vbH / 2;
    svgElement.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
  }, []);

  // Update zoom ref + state + viewBox
  const applyZoom = useCallback((newZoom: number, newVC?: { x: number; y: number }) => {
    zoomRef.current = newZoom;
    setZoom(newZoom);
    if (newVC) {
      viewCenterRef.current = newVC;
      setViewCenter(newVC);
    }
    updateViewBox(newZoom, newVC);
  }, [updateViewBox]);

  // Update viewCenter ref + state + viewBox
  const applyVC = useCallback((newVC: { x: number; y: number }) => {
    viewCenterRef.current = newVC;
    setViewCenter(newVC);
    updateViewBox(undefined, newVC);
  }, [updateViewBox]);

  // Helper: get base fit scale (how many pixels per SVG unit at zoom=1)
  const getBaseFitScale = useCallback(() => {
    const container = mapContainerRef.current;
    if (!container) return 1;
    const rect = container.getBoundingClientRect();
    const { width: origW, height: origH } = svgDimsRef.current;
    return Math.min(rect.width / origW, rect.height / origH);
  }, []);

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
        const center = { x: originalWidth / 2, y: originalHeight / 2 };
        viewCenterRef.current = center;
        setViewCenter(center);

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

  // Sync viewBox after React render (backup for state-driven changes like initial load)
  useLayoutEffect(() => {
    updateViewBox();
  }, [zoom, viewCenter, svgContent, updateViewBox]);



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
    const curZ = zoomRef.current;
    const curVC = viewCenterRef.current;
    const newZoom = Math.max(0.5, Math.min(10, e.deltaY > 0 ? curZ / zoomFactor : curZ * zoomFactor));
    
    const container = mapContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const { width: origW, height: origH } = svgDimsRef.current;
      const bfs = Math.min(rect.width / origW, rect.height / origH);
      const offsetX = (rect.width - origW * bfs) / 2;
      const offsetY = (rect.height - origH * bfs) / 2;
      
      const msX = (e.clientX - rect.left - offsetX) / bfs;
      const msY = (e.clientY - rect.top - offsetY) / bfs;
      
      const svgX = curVC.x - origW / (2 * curZ) + msX / curZ;
      const svgY = curVC.y - origH / (2 * curZ) + msY / curZ;
      
      const newVC = {
        x: svgX + origW / (2 * newZoom) - msX / newZoom,
        y: svgY + origH / (2 * newZoom) - msY / newZoom,
      };
      applyZoom(newZoom, newVC);
    } else {
      applyZoom(newZoom);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    const bfs = getBaseFitScale();
    const curZ = zoomRef.current;
    
    const newVC = {
      x: viewCenterRef.current.x - deltaX / (bfs * curZ),
      y: viewCenterRef.current.y - deltaY / (bfs * curZ),
    };
    applyVC(newVC);
    
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleZoomIn = () => {
    applyZoom(Math.min(10, zoomRef.current + 0.5));
  };

  const handleZoomOut = () => {
    applyZoom(Math.max(0.5, zoomRef.current - 0.5));
  };

  const handleResetView = () => {
    const { width, height } = svgDimsRef.current;
    const newVC = { x: width / 2, y: height / 2 };
    applyZoom(1, newVC);
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
  
  // Momentum animation driven entirely by refs + rAF
  const startMomentum = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const deceleration = 0.95;
    const minVelocity = 0.0001;

    const animate = () => {
      const vel = velocityRef.current;
      const newVel = {
        x: vel.x * deceleration,
        y: vel.y * deceleration,
      };

      if (Math.abs(newVel.x) < minVelocity && Math.abs(newVel.y) < minVelocity) {
        isAnimatingRef.current = false;
        velocityRef.current = { x: 0, y: 0 };
        return;
      }

      velocityRef.current = newVel;
      const newVC = {
        x: viewCenterRef.current.x + newVel.x,
        y: viewCenterRef.current.y + newVel.y,
      };
      viewCenterRef.current = newVC;
      setViewCenter(newVC);
      updateViewBox(undefined, newVC);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [updateViewBox]);

  const stopMomentum = useCallback(() => {
    isAnimatingRef.current = false;
    velocityRef.current = { x: 0, y: 0 };
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    isTouchRef.current = true;
    touchCountRef.current = e.touches.length;
    touchStartTimeRef.current = Date.now();
    touchMovedRef.current = false;
    stopMomentum();
    
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      const center = getTouchCenter(e.touches[0], e.touches[1]);
      
      initialPinchDistanceRef.current = distance;
      initialZoomRef.current = zoomRef.current;
      initialPinchCenterRef.current = center;
      initialViewCenterRef.current = { ...viewCenterRef.current };
      e.preventDefault();
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
      lastTouchTime.current = Date.now();
      lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistanceRef.current > 0) {
      // Pinch zoom
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const currentCenter = getTouchCenter(e.touches[0], e.touches[1]);

      const rawScale = currentDistance / initialPinchDistanceRef.current;
      const scale = Math.pow(rawScale, 0.9);
      const iZoom = initialZoomRef.current;
      const newZoom = Math.max(0.5, Math.min(10, iZoom * scale));

      const container = mapContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const { width: origW, height: origH } = svgDimsRef.current;
        const bfs = Math.min(rect.width / origW, rect.height / origH);
        const offsetX = (rect.width - origW * bfs) / 2;
        const offsetY = (rect.height - origH * bfs) / 2;
        const iVC = initialViewCenterRef.current;
        const iPC = initialPinchCenterRef.current;

        const pcX = (iPC.x - rect.left - offsetX) / bfs;
        const pcY = (iPC.y - rect.top - offsetY) / bfs;

        const svgX = iVC.x - origW / (2 * iZoom) + pcX / iZoom;
        const svgY = iVC.y - origH / (2 * iZoom) + pcY / iZoom;

        const curPcX = (currentCenter.x - rect.left - offsetX) / bfs;
        const curPcY = (currentCenter.y - rect.top - offsetY) / bfs;

        const newVC = {
          x: svgX + origW / (2 * newZoom) - curPcX / newZoom,
          y: svgY + origH / (2 * newZoom) - curPcY / newZoom,
        };
        applyZoom(newZoom, newVC);
      } else {
        applyZoom(newZoom);
      }

      touchMovedRef.current = true;
    } else if (e.touches.length === 1 && initialPinchDistanceRef.current === 0 && !isAnimatingRef.current) {
      // Single finger pan
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastMousePosRef.current.x;
      const deltaY = touch.clientY - lastMousePosRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > 3) {
        if (!touchMovedRef.current) {
          touchMovedRef.current = true;
          isDraggingRef.current = true;
        }
        e.preventDefault();

        const now = Date.now();
        if (now - lastTouchTime.current > 16) {
          const bfs = getBaseFitScale();
          const curZ = zoomRef.current;
          const svgDeltaX = deltaX / (bfs * curZ);
          const svgDeltaY = deltaY / (bfs * curZ);

          const newVC = {
            x: viewCenterRef.current.x - svgDeltaX,
            y: viewCenterRef.current.y - svgDeltaY,
          };
          applyVC(newVC);

          velocityRef.current = {
            x: -svgDeltaX * 0.8,
            y: -svgDeltaY * 0.8,
          };

          lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
          lastTouchTime.current = now;
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      const touchDuration = Date.now() - touchStartTimeRef.current;
      
      if (!touchMovedRef.current && touchDuration < 300 && touchCountRef.current === 1) {
        const target = e.target as Element;
        if (target && target.tagName === 'path' && target.id) {
          const countryId = target.id.toLowerCase();
          handleCountryClick(countryId);
        }
      } else if (touchMovedRef.current && touchCountRef.current === 1) {
        const vel = velocityRef.current;
        const mag = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        if (mag > 0.01) {
          startMomentum();
        }
      }
      
      isDraggingRef.current = false;
      isTouchRef.current = false;
      initialPinchDistanceRef.current = 0;
      touchCountRef.current = 0;
      touchMovedRef.current = false;
    } else if (e.touches.length === 1 && touchCountRef.current === 2) {
      initialPinchDistanceRef.current = 0;
      touchCountRef.current = 1;
      lastMousePosRef.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      };
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
        transition: ${isDraggingRef.current || isTouchRef.current ? 'none !important' : 'all 0.2s ease !important'};
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