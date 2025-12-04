
import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import type { Point, Circle, Mode, Pan, GroupMetrics } from '../types';

export interface CanvasHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    zoomToSelection: () => void;
}

interface CanvasComponentProps {
    image: HTMLImageElement;
    circles: Circle[];
    selectedIndices: number[];
    onCanvasClick: (point: Point) => void;
    mode: Mode;
    groupMetrics: GroupMetrics | null;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

export const CanvasComponent = forwardRef<CanvasHandle, CanvasComponentProps>(({
    image,
    circles,
    selectedIndices,
    onCanvasClick,
    mode,
    groupMetrics,
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const hasPerformedInitialFit = useRef<boolean>(false);
    
    // Local state for high-performance interaction (prevents App re-renders)
    const zoom = useRef(1);
    const pan = useRef<Pan>({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const isSpaceDown = useRef(false);
    const lastPanPoint = useRef<Point>({ x: 0, y: 0 });
    const initializedImgSrc = useRef<string | null>(null);
    const requestRef = useRef<number>(0);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas || !image) return;

        // Reset transform to identity before clearing
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const dpr = window.devicePixelRatio || 1;
        // Ensure smoothing is enabled for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.save();
        ctx.scale(dpr, dpr);
        
        const currentZoom = zoom.current;
        const currentPan = pan.current;

        // Apply transformations
        ctx.translate(currentPan.x, currentPan.y);
        ctx.scale(currentZoom, currentZoom);
        
        ctx.drawImage(image, 0, 0);

        // Draw circles
        circles.forEach((circle, index) => {
            const isSelected = selectedIndices.includes(index);
            // Scale line width so it remains visible but thin
            const lineWidth = isSelected ? 3 / currentZoom : 2 / currentZoom;
            const radiusDisplay = circle.radius;
            
            ctx.strokeStyle = isSelected ? '#06b6d4' : '#f87171';
            ctx.fillStyle = isSelected ? 'rgba(6, 182, 212, 0.5)' : 'rgba(248, 113, 113, 0.3)';
            ctx.lineWidth = lineWidth;

            ctx.beginPath();
            ctx.arc(circle.x, circle.y, radiusDisplay, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Center point
            ctx.fillStyle = isSelected ? '#06b6d4' : '#f87171';
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, 2 / currentZoom, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw measurement line
        if (mode === 'distance' && selectedIndices.length === 2) {
            const [c1, c2] = selectedIndices.map(i => circles[i]);
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2 / currentZoom;
            ctx.beginPath();
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c2.x, c2.y);
            ctx.stroke();
        }

        // Draw Group Metrics "On the Photo"
        if (groupMetrics) {
            // Calculate font size relative to image height to maintain readability at any resolution
            // Reduced by 25% as requested (0.03 * 0.75 = 0.0225)
            const fontSize = Math.max(10, image.height * 0.0225); 
            
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = '#00008B'; // Dark Blue
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            
            // Add white shadow/outline for better visibility on dark targets
            ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            const margin = fontSize * 0.5;
            const x = margin;
            const y = image.height - margin;
            const lineHeight = fontSize * 1.2;

            // Draw bottom line first, then move up
            ctx.fillText(`Std. Dev. (Y): ${groupMetrics.stdDev.y.toFixed(2)} mm`, x, y);
            ctx.fillText(`Std. Dev. (X): ${groupMetrics.stdDev.x.toFixed(2)} mm`, x, y - lineHeight);
            ctx.fillText(`Group Size: ${groupMetrics.extremeSpread.toFixed(2)} mm`, x, y - lineHeight * 2);
            ctx.fillText(`Total Shots: ${groupMetrics.count}`, x, y - lineHeight * 3);
        }
        
        ctx.restore();

    }, [image, circles, selectedIndices, mode, groupMetrics]);

    const animate = useCallback(() => {
        draw();
        requestRef.current = requestAnimationFrame(animate);
    }, [draw]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [animate]);

    const resetZoom = useCallback(() => {
        const container = containerRef.current;
        if (!container || !image) return;
        
        // Use container dimensions
        const w = dimensions.width || container.clientWidth;
        const h = dimensions.height || container.clientHeight;
        if (w === 0 || h === 0) return;

        const newZoom = Math.min(w / image.naturalWidth, h / image.naturalHeight);
        
        // Set values directly to refs for immediate update
        zoom.current = newZoom;
        pan.current = {
            x: (w - image.naturalWidth * newZoom) / 2,
            y: (h - image.naturalHeight * newZoom) / 2,
        };
        
        hasPerformedInitialFit.current = true;
    }, [image, dimensions]);

    const zoomToSelection = useCallback(() => {
        const container = containerRef.current;
        if (selectedIndices.length < 1 || !container) return;

        const selectedCircles = selectedIndices.map(i => circles[i]);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selectedCircles.forEach(c => {
            minX = Math.min(minX, c.x - c.radius);
            minY = Math.min(minY, c.y - c.radius);
            maxX = Math.max(maxX, c.x + c.radius);
            maxY = Math.max(maxY, c.y + c.radius);
        });

        const boxWidth = maxX - minX;
        const boxHeight = maxY - minY;
        const boxCenterX = minX + boxWidth / 2;
        const boxCenterY = minY + boxHeight / 2;

        const w = dimensions.width || container.clientWidth;
        const h = dimensions.height || container.clientHeight;

        if (boxWidth === 0 || boxHeight === 0) { // Single point
            const newZoom = 2;
            zoom.current = newZoom;
            pan.current = {
                x: (w / 2) - (boxCenterX * newZoom),
                y: (h / 2) - (boxCenterY * newZoom),
            };
            return;
        }

        const padding = 0.8;
        const newZoom = Math.min(w / boxWidth, h / boxHeight) * padding;
        zoom.current = newZoom;
        pan.current = {
            x: (w / 2) - (boxCenterX * newZoom),
            y: (h / 2) - (boxCenterY * newZoom),
        };
    }, [circles, selectedIndices, dimensions]);

    useImperativeHandle(ref, () => ({
        zoomIn: () => { zoom.current = Math.min(MAX_ZOOM, zoom.current * 1.2); },
        zoomOut: () => { zoom.current = Math.max(MIN_ZOOM, zoom.current / 1.2); },
        resetZoom,
        zoomToSelection
    }));

    // Monitor container size changes
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = Math.floor(entry.contentRect.width);
                const height = Math.floor(entry.contentRect.height);
                setDimensions({ width, height });
                
                // If this is the first time we have valid dimensions and an image, reset zoom
                if (image && width > 0 && height > 0 && !hasPerformedInitialFit.current) {
                     setTimeout(resetZoom, 0);
                }
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [image, resetZoom]);

    // Reset zoom when image changes (once per image)
    useEffect(() => {
        if (image && dimensions.width > 0 && image.src !== initializedImgSrc.current) {
            resetZoom();
            initializedImgSrc.current = image.src;
        } else if (image && image.src !== initializedImgSrc.current) {
             // Image changed but dims not ready, reset flag
             hasPerformedInitialFit.current = false;
             initializedImgSrc.current = image.src;
        }
    }, [image, dimensions, resetZoom]);

    // Handle High-DPI Canvas Sizing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && dimensions.width > 0 && dimensions.height > 0) {
            const dpr = window.devicePixelRatio || 1;
            // Set actual render buffer size
            canvas.width = dimensions.width * dpr;
            canvas.height = dimensions.height * dpr;
            // Style width ensures it fits container visually
            canvas.style.width = `${dimensions.width}px`;
            canvas.style.height = `${dimensions.height}px`;
        }
    }, [dimensions]);

    const getTransformedPoint = useCallback((clientX: number, clientY: number): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        return {
            x: (canvasX - pan.current.x) / zoom.current,
            y: (canvasY - pan.current.y) / zoom.current,
        };
    }, []);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') isSpaceDown.current = true; };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') isSpaceDown.current = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0 && isSpaceDown.current) {
            isPanning.current = true;
            lastPanPoint.current = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isPanning.current) {
            const dx = e.clientX - lastPanPoint.current.x;
            const dy = e.clientY - lastPanPoint.current.y;
            pan.current = { x: pan.current.x + dx, y: pan.current.y + dy };
            lastPanPoint.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => { isPanning.current = false; };
    
    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const delta = e.deltaY * -0.005;
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.current + delta));
        
        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate world point under mouse before zoom
        const worldX = (mouseX - pan.current.x) / zoom.current;
        const worldY = (mouseY - pan.current.y) / zoom.current;

        // Update zoom
        zoom.current = newZoom;
        
        // Calculate new pan to keep world point under mouse
        pan.current = {
            x: mouseX - worldX * newZoom,
            y: mouseY - worldY * newZoom,
        };
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isSpaceDown.current) return; 
        onCanvasClick(getTransformedPoint(e.clientX, e.clientY));
    };

    return (
        <div ref={containerRef} className="w-full h-full cursor-default overflow-hidden">
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
                style={{ cursor: isSpaceDown.current ? 'grab' : 'crosshair' }}
                className="block w-full h-full touch-none"
            />
        </div>
    );
});
CanvasComponent.displayName = 'CanvasComponent';
