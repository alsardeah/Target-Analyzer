import React, { useRef, useEffect, useCallback } from 'react';
import type { Point, Circle, Mode } from '../types';

interface CanvasComponentProps {
    image: HTMLImageElement;
    circles: Circle[];
    selectedIndices: number[];
    onCanvasClick: (point: Point) => void;
    mode: Mode;
}

export const CanvasComponent: React.FC<CanvasComponentProps> = ({
    image,
    circles,
    selectedIndices,
    onCanvasClick,
    mode,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height),
        };
    };
    
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);

        // Draw all circles
        circles.forEach((circle, index) => {
            const isSelected = selectedIndices.includes(index);
            
            ctx.strokeStyle = isSelected ? '#06b6d4' : '#f87171'; // cyan for selected, red for others
            ctx.fillStyle = isSelected ? 'rgba(6, 182, 212, 0.5)' : 'rgba(248, 113, 113, 0.3)';
            ctx.lineWidth = isSelected ? 3 : 2;

            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Draw center dot
            ctx.fillStyle = isSelected ? '#06b6d4' : '#f87171';
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, 2, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw measurement lines
        if (mode === 'distance' && selectedIndices.length === 2) {
            const [c1, c2] = selectedIndices.map(i => circles[i]);
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c2.x, c2.y);
            ctx.stroke();
        }

    }, [image, circles, selectedIndices, mode]);

    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (canvas && container && image) {
                const containerRect = container.getBoundingClientRect();
                const imageAspectRatio = image.naturalWidth / image.naturalHeight;
                const containerAspectRatio = containerRect.width / containerRect.height;
                
                if (imageAspectRatio > containerAspectRatio) {
                    canvas.style.width = '100%';
                    canvas.style.height = 'auto';
                } else {
                    canvas.style.width = 'auto';
                    canvas.style.height = '100%';
                }
                draw();
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [image, draw]);

    useEffect(() => {
        draw();
    }, [draw]);

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        onCanvasClick(getCanvasPoint(e));
    };

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                onContextMenu={(e) => e.preventDefault()}
                className="max-w-full max-h-full object-contain"
            />
        </div>
    );
};