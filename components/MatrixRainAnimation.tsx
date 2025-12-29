
import React, { useEffect, useRef, memo } from 'react';

const MatrixRainAnimation: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        
        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        resize();

        // Numeric character set for "Numbers Background Animation"
        const alphabet = '0123456789'; 
        const fontSize = 16;
        let columns = Math.floor(width / fontSize);
        const drops: number[] = [];
        
        const initDrops = () => {
            columns = Math.floor(width / fontSize);
            if (drops.length < columns) {
                for (let i = drops.length; i < columns; i++) {
                    drops[i] = Math.random() * (height / fontSize);
                }
            }
        };
        initDrops();

        let animationFrameId: number;

        const draw = () => {
            // Use destination-out to fade existing pixels to transparency
            // This allows the animation to sit behind glassy UI elements without a solid black background
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, width, height);
            
            ctx.globalCompositeOperation = 'source-over';
            ctx.font = `bold ${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                // High-intensity green for visibility
                if (Math.random() > 0.98) {
                     ctx.fillStyle = '#fff'; // Occasional white spark
                } else {
                     ctx.fillStyle = '#0F0'; // Standard neon green
                }

                ctx.fillText(text, x, y);

                if (y > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        const handleResize = () => {
            resize();
            initDrops();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
            <canvas 
                ref={canvasRef} 
                className="w-full h-full opacity-60"
            />
        </div>
    );
};

export default memo(MatrixRainAnimation);
