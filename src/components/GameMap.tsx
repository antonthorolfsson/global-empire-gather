import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Country {
  id: string;
  name: string;
  owner?: string;
  population: number;
  area: number;
  gdp: number;
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
  players,
}) => {
  const [svgContent, setSvgContent] = useState('');
  const [zoomDisplay, setZoomDisplay] = useState(1);

  // All mutable interaction state lives in a single ref — no useCallback chains needed
  const stateRef = useRef({
    zoom: 1,
    vcX: 504.836,
    vcY: 332.982,
    origW: 1009.6727,
    origH: 665.96301,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    // touch
    touchCount: 0,
    touchMoved: false,
    touchStartTime: 0,
    pinchDist0: 0,
    pinchZoom0: 1,
    pinchCenterX0: 0,
    pinchCenterY0: 0,
    pinchVcX0: 0,
    pinchVcY0: 0,
    // momentum
    velX: 0,
    velY: 0,
    animating: false,
    animFrame: 0 as number,
    lastMoveTime: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Keep latest props in a ref so native listeners can access them without re-registration
  const propsRef = useRef({ onCountrySelect, players });
  propsRef.current = { onCountrySelect, players };

  // ─── Helpers ──────────────────────────────────────────────

  const updateViewBox = () => {
    const svg = document.getElementById('world-map-svg');
    if (!svg) return;
    const s = stateRef.current;
    const vbW = s.origW / s.zoom;
    const vbH = s.origH / s.zoom;
    svg.setAttribute('viewBox', `${s.vcX - vbW / 2} ${s.vcY - vbH / 2} ${vbW} ${vbH}`);
  };

  const getBFS = () => {
    const c = containerRef.current;
    if (!c) return 1;
    const r = c.getBoundingClientRect();
    const s = stateRef.current;
    return Math.min(r.width / s.origW, r.height / s.origH);
  };

  const setZoomAndVC = (z: number, vcX?: number, vcY?: number) => {
    const s = stateRef.current;
    s.zoom = z;
    if (vcX !== undefined && vcY !== undefined) {
      s.vcX = vcX;
      s.vcY = vcY;
    }
    updateViewBox();
    setZoomDisplay(z);
  };

  const setVC = (vcX: number, vcY: number) => {
    const s = stateRef.current;
    s.vcX = vcX;
    s.vcY = vcY;
    updateViewBox();
  };

  const getCountryOwner = (countryId: string) => {
    return propsRef.current.players.find(
      (p) => p.countries && Array.isArray(p.countries) && p.countries.includes(countryId)
    );
  };

  const handleCountryClick = (countryId: string) => {
    if (!getCountryOwner(countryId)) {
      propsRef.current.onCountrySelect(countryId);
    }
  };

  // ─── SVG Loading ──────────────────────────────────────────

  useEffect(() => {
    import('/src/assets/world-map.svg?raw')
      .then((module) => {
        if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
          setSvgContent(module.default);
          return;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(module.default, 'image/svg+xml');
        const el = doc.documentElement as unknown as SVGSVGElement | null;
        if (!el || el.tagName.toLowerCase() !== 'svg') {
          setSvgContent(module.default);
          return;
        }

        const w = parseFloat(el.getAttribute('width') || '1009.6727');
        const h = parseFloat(el.getAttribute('height') || '665.96301');

        const s = stateRef.current;
        s.origW = w;
        s.origH = h;
        s.vcX = w / 2;
        s.vcY = h / 2;

        el.setAttribute('id', 'world-map-svg');
        el.setAttribute('width', '100%');
        el.setAttribute('height', '100%');
        el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        if (!el.getAttribute('viewBox')) {
          el.setAttribute('viewBox', `0 0 ${w} ${h}`);
        }
        el.setAttribute('shape-rendering', 'geometricPrecision');
        el.setAttribute('text-rendering', 'geometricPrecision');
        el.setAttribute(
          'style',
          'shape-rendering:geometricPrecision;text-rendering:geometricPrecision;'
        );
        el.querySelectorAll<SVGPathElement>('path').forEach((p) => {
          p.setAttribute('vector-effect', 'non-scaling-stroke');
          p.setAttribute('shape-rendering', 'geometricPrecision');
        });

        const serializer = new XMLSerializer();
        setSvgContent(serializer.serializeToString(el));
      })
      .catch((err) => console.error('Error loading world map:', err));
  }, []);

  // Sync viewBox after initial load + whenever zoomDisplay changes (for button clicks)
  useLayoutEffect(() => {
    updateViewBox();
  }, [svgContent, zoomDisplay]);

  // ─── Pointer / Touch Listeners (native, passive:false) ───

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svgContent) return;

    const s = stateRef.current;

    // --- Wheel ---
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = 1.2;
      const newZ = Math.max(0.5, Math.min(10, e.deltaY > 0 ? s.zoom / factor : s.zoom * factor));

      const rect = container.getBoundingClientRect();
      const bfs = Math.min(rect.width / s.origW, rect.height / s.origH);
      const offX = (rect.width - s.origW * bfs) / 2;
      const offY = (rect.height - s.origH * bfs) / 2;
      const msX = (e.clientX - rect.left - offX) / bfs;
      const msY = (e.clientY - rect.top - offY) / bfs;

      const svgX = s.vcX - s.origW / (2 * s.zoom) + msX / s.zoom;
      const svgY = s.vcY - s.origH / (2 * s.zoom) + msY / s.zoom;
      setZoomAndVC(
        newZ,
        svgX + s.origW / (2 * newZ) - msX / newZ,
        svgY + s.origH / (2 * newZ) - msY / newZ
      );
    };

    // --- Mouse ---
    const onMouseDown = (e: MouseEvent) => {
      s.isDragging = true;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!s.isDragging) return;
      const bfs = getBFS();
      setVC(
        s.vcX - (e.clientX - s.lastX) / (bfs * s.zoom),
        s.vcY - (e.clientY - s.lastY) / (bfs * s.zoom)
      );
      s.lastX = e.clientX;
      s.lastY = e.clientY;
    };
    const onMouseUp = () => {
      s.isDragging = false;
    };

    // --- Touch helpers ---
    const dist = (a: Touch, b: Touch) => {
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const stopMomentum = () => {
      s.animating = false;
      s.velX = 0;
      s.velY = 0;
      if (s.animFrame) cancelAnimationFrame(s.animFrame);
    };

    const startMomentum = () => {
      if (s.animating) return;
      s.animating = true;
      const tick = () => {
        s.velX *= 0.95;
        s.velY *= 0.95;
        if (Math.abs(s.velX) < 0.0001 && Math.abs(s.velY) < 0.0001) {
          s.animating = false;
          return;
        }
        setVC(s.vcX + s.velX, s.vcY + s.velY);
        s.animFrame = requestAnimationFrame(tick);
      };
      s.animFrame = requestAnimationFrame(tick);
    };

    // --- Touch ---
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      stopMomentum();
      s.touchCount = e.touches.length;
      s.touchStartTime = Date.now();
      s.touchMoved = false;

      if (e.touches.length === 2) {
        s.pinchDist0 = dist(e.touches[0], e.touches[1]);
        s.pinchZoom0 = s.zoom;
        s.pinchCenterX0 = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        s.pinchCenterY0 = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        s.pinchVcX0 = s.vcX;
        s.pinchVcY0 = s.vcY;
      } else if (e.touches.length === 1) {
        s.lastX = e.touches[0].clientX;
        s.lastY = e.touches[0].clientY;
        s.lastMoveTime = Date.now();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 2 && s.pinchDist0 > 0) {
        // Pinch zoom
        const curDist = dist(e.touches[0], e.touches[1]);
        const rawScale = curDist / s.pinchDist0;
        const newZ = Math.max(0.5, Math.min(10, s.pinchZoom0 * Math.pow(rawScale, 0.9)));

        const rect = container.getBoundingClientRect();
        const bfs = Math.min(rect.width / s.origW, rect.height / s.origH);
        const offX = (rect.width - s.origW * bfs) / 2;
        const offY = (rect.height - s.origH * bfs) / 2;

        // Initial pinch center → SVG point
        const pcX0 = (s.pinchCenterX0 - rect.left - offX) / bfs;
        const pcY0 = (s.pinchCenterY0 - rect.top - offY) / bfs;
        const svgX = s.pinchVcX0 - s.origW / (2 * s.pinchZoom0) + pcX0 / s.pinchZoom0;
        const svgY = s.pinchVcY0 - s.origH / (2 * s.pinchZoom0) + pcY0 / s.pinchZoom0;

        // Current pinch center
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const pcX1 = (cx - rect.left - offX) / bfs;
        const pcY1 = (cy - rect.top - offY) / bfs;

        setZoomAndVC(
          newZ,
          svgX + s.origW / (2 * newZ) - pcX1 / newZ,
          svgY + s.origH / (2 * newZ) - pcY1 / newZ
        );
        s.touchMoved = true;
      } else if (e.touches.length === 1 && s.pinchDist0 === 0 && !s.animating) {
        // Single-finger pan
        const tx = e.touches[0].clientX;
        const ty = e.touches[0].clientY;
        const dx = tx - s.lastX;
        const dy = ty - s.lastY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          s.touchMoved = true;
          s.isDragging = true;
          const now = Date.now();
          if (now - s.lastMoveTime > 16) {
            const bfs = getBFS();
            const svgDx = dx / (bfs * s.zoom);
            const svgDy = dy / (bfs * s.zoom);
            setVC(s.vcX - svgDx, s.vcY - svgDy);
            s.velX = -svgDx * 0.8;
            s.velY = -svgDy * 0.8;
            s.lastX = tx;
            s.lastY = ty;
            s.lastMoveTime = now;
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        const dur = Date.now() - s.touchStartTime;
        if (!s.touchMoved && dur < 300 && s.touchCount === 1) {
          // Tap → country select
          const target = e.target as Element;
          if (target?.tagName === 'path' && target.id) {
            handleCountryClick(target.id.toLowerCase());
          }
        } else if (s.touchMoved && s.touchCount === 1) {
          const mag = Math.sqrt(s.velX * s.velX + s.velY * s.velY);
          if (mag > 0.01) startMomentum();
        }
        s.isDragging = false;
        s.pinchDist0 = 0;
        s.touchCount = 0;
        s.touchMoved = false;
      } else if (e.touches.length === 1 && s.touchCount === 2) {
        // Went from 2 → 1 finger: start pan from current finger position
        s.pinchDist0 = 0;
        s.touchCount = 1;
        s.lastX = e.touches[0].clientX;
        s.lastY = e.touches[0].clientY;
        s.lastMoveTime = Date.now();
      }
    };

    // Register all listeners
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      stopMomentum();
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
    // Re-run when svgContent loads so the container ref is valid
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgContent]);

  // ─── Country Styling ──────────────────────────────────────

  useEffect(() => {
    if (!svgContent) return;

    const styleElement =
      document.getElementById('map-country-styles') || document.createElement('style');
    styleElement.id = 'map-country-styles';

    let css = `
      #world-map-svg path {
        fill: #000000 !important;
        stroke: #ffffff !important;
        stroke-width: 0.5px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        opacity: 1 !important;
      }
    `;

    players.forEach((player) => {
      if (player.countries && Array.isArray(player.countries)) {
        player.countries.forEach((cid) => {
          if (cid && typeof cid === 'string') {
            css += `
              #world-map-svg path#${cid.toUpperCase()} {
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

    selectedCountries.forEach((cid) => {
      if (cid && typeof cid === 'string') {
        css += `
          #world-map-svg path#${cid.toUpperCase()} {
            stroke: white !important;
            stroke-width: 0.5px !important;
          }
        `;
      }
    });

    const owned = players
      .flatMap((p) =>
        (p.countries || []).filter((id) => id && typeof id === 'string').map((id) => id.toUpperCase())
      );
    if (owned.length > 0) {
      css += `
        #world-map-svg path:not(${owned.map((id) => `#${id}`).join(', ')}):hover {
          fill: hsl(var(--primary-glow)) !important;
        }
      `;
    }

    styleElement.textContent = css;
    if (!document.getElementById('map-country-styles')) {
      document.head.appendChild(styleElement);
    }

    // Click handlers for country paths
    const svgEl = document.getElementById('world-map-svg');
    if (!svgEl) return;

    const paths = svgEl.querySelectorAll('path[id]') as NodeListOf<SVGPathElement>;
    const handlers = new Map<SVGPathElement, () => void>();
    paths.forEach((path) => {
      const cid = path.id.toLowerCase();
      const handler = () => handleCountryClick(cid);
      path.addEventListener('click', handler);
      handlers.set(path, handler);
    });

    return () => {
      paths.forEach((path) => {
        const h = handlers.get(path);
        if (h) path.removeEventListener('click', h);
      });
      const el = document.getElementById('map-country-styles');
      if (el) el.remove();
    };
  }, [svgContent, players, selectedCountries]);

  // ─── Zoom button handlers ────────────────────────────────

  const handleZoomIn = () => {
    setZoomAndVC(Math.min(10, stateRef.current.zoom + 0.5));
  };
  const handleZoomOut = () => {
    setZoomAndVC(Math.max(0.5, stateRef.current.zoom - 0.5));
  };
  const handleResetView = () => {
    const s = stateRef.current;
    setZoomAndVC(1, s.origW / 2, s.origH / 2);
  };

  // ─── Render ───────────────────────────────────────────────

  return (
    <Card className="w-full overflow-hidden md:h-full h-[70vh]" style={{ background: 'hsl(200 70% 85%)' }}>
      <div className="relative w-full h-full animate-map-zoom">
        {svgContent ? (
          <div
            ref={containerRef}
            className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
            style={{ userSelect: 'none', touchAction: 'none' }}
          >
            <div
              id="world-map-container"
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-primary-foreground">Loading world map...</div>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto">
          <Button variant="secondary" size="sm" onClick={handleZoomIn} className="w-10 h-10 p-0">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={handleZoomOut} className="w-10 h-10 p-0">
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
              Current Turn:{' '}
              <span
                className="font-bold"
                style={{
                  color:
                    players.find((p) => p.name === currentPlayer)?.color || 'hsl(var(--accent))',
                }}
              >
                {currentPlayer}
              </span>
            </p>
          </div>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 animate-strategic-fade-in">
            <p className="text-sm font-medium text-card-foreground">
              Countries Selected:{' '}
              <span className="text-primary font-bold">{selectedCountries.length}</span>
            </p>
          </div>
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-16 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-2 pointer-events-none">
          <p className="text-xs text-card-foreground">Zoom: {Math.round(zoomDisplay * 100)}%</p>
        </div>
      </div>
    </Card>
  );
};

export default GameMap;
