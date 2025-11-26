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

        const katakana = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
        const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nums = '0123456789';
        const alphabet = katakana + latin + nums;

        const fontSize = 14;
        let columns = Math.floor(width / fontSize);
        const drops: number[] = [];
        
        const initDrops = () => {
            columns = Math.floor(width / fontSize);
            // Preserve existing drops if possible, extend if needed
            if (drops.length < columns) {
                for (let i = drops.length; i < columns; i++) {
                    drops[i] = Math.random() * (height / fontSize);
                }
            }
        };
        initDrops();

        let animationFrameId: number;

        const draw = () => {
            // Black background with very low opacity to create the trail effect
            // Use rgba to allow some layering if needed, but essentially opaque for the trail mechanism
            ctx.fillStyle = 'rgba(2, 2, 2, 0.05)';
            ctx.fillRect(0, 0, width, height);

            // Reduced opacity green for the characters to not hinder view
            ctx.fillStyle = 'rgba(0, 255, 65, 0.35)'; 
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                // Randomly brighter characters
                if (Math.random() > 0.975) {
                     ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; 
                } else {
                     ctx.fillStyle = 'rgba(0, 255, 65, 0.35)';
                }

                ctx.fillText(text, x, y);

                // Reset logic
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
        <div className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-black">
            <canvas 
                ref={canvasRef} 
                className="w-full h-full"
            />
        </div>
    );
};

export default memo(MatrixRainAnimation);