
import React, { useEffect, useRef } from 'react';

interface InfinityParticlesAnimationProps {
    density?: number;
    theme?: string;
    shape?: number; // 0=Infinity, 1=Notebook, 2=Pen, 3=Torso
    scrollProgress?: number; // 0 to 1, representing scroll amount to scale down
    horizontalOffset?: number; // -1 to 1, percentage of width to shift
}

const InfinityParticlesAnimation: React.FC<InfinityParticlesAnimationProps> = ({ 
    density = 0.01, 
    theme, 
    shape = 0, 
    scrollProgress = 0,
    horizontalOffset = 0
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<any[]>([]);
    const startTimeRef = useRef<number>(0); // Initialize as 0 to detect first run
    const animationFrameIdRef = useRef<number>(0);
    const scrollProgressRef = useRef(scrollProgress);

    // Keep ref in sync for animation loop
    useEffect(() => {
        scrollProgressRef.current = scrollProgress;
    }, [scrollProgress]);

    // Initial Setup & Resize Listener
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        
        const LAYERS_PER_STEP = 6; 
        const MOUSE_RADIUS = 250; 
        const RETURN_SPEED = 0.08;
        const DAMPING = 0.92;
        
        const mouse = { x: -1000, y: -1000 };

        const getThemeColors = () => {
            const styles = getComputedStyle(document.documentElement);
            return {
                accent: styles.getPropertyValue('--accent').trim() || '#3b82f6',
                secondary: styles.getPropertyValue('--text-secondary').trim() || '#64748b'
            };
        };

        const initParticles = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            particlesRef.current = [];
            
            // Do not reset startTimeRef here so zoom-out only plays once
            if (startTimeRef.current === 0) {
                startTimeRef.current = Date.now();
            }

            const { accent, secondary } = getThemeColors();

            for (let t = 0; t <= 2 * Math.PI; t += density) {
                let normX = 0;
                let normY = 0;

                if (shape === 0) {
                    // Infinity (Lemniscate of Bernoulli)
                    const denom = 1 + Math.pow(Math.sin(t), 2);
                    normX = (Math.cos(t)) / denom;
                    normY = (Math.sin(t) * Math.cos(t)) / denom;
                } else if (shape === 1) {
                    // Open Notebook / Brain shape
                    normX = Math.cos(t);
                    normY = 0.6 * Math.sin(t) - 0.2 * Math.cos(2*t);
                } else if (shape === 2) {
                    // Pen (Capsule / Pill shape)
                    normX = 0.12 * Math.cos(t);
                    normY = 0.8 * Math.sin(t);
                } else if (shape === 3) {
                    // Torso (Head and Shoulders)
                    if (t < Math.PI) {
                        normX = 0.25 * Math.cos(2 * t);
                        normY = -0.3 + 0.25 * Math.sin(2 * t);
                    } else {
                        const t2 = t - Math.PI; 
                        normX = 0.6 * Math.cos(t2);
                        normY = 0.3 + 0.3 * Math.sin(t2);
                    }
                }
                
                for (let i = 0; i < LAYERS_PER_STEP; i++) {
                    const scatterX = (Math.random() * 20 - 10) * (1 + i * 0.1);
                    const scatterY = (Math.random() * 20 - 10) * (1 + i * 0.1);
                    
                    particlesRef.current.push({
                        baseX: normX,
                        baseY: normY,
                        x: 0, 
                        y: 0,
                        vx: 0,
                        vy: 0,
                        size: Math.random() * 2.5 + 2.0, 
                        color: Math.random() > 0.6 ? accent : secondary,
                        scatterX,
                        scatterY
                    });
                }
            }
        };

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            
            const elapsed = Date.now() - startTimeRef.current;
            const duration = 2500; 
            let progress = Math.min(elapsed / duration, 1);
            
            const ease = 1 - Math.pow(1 - progress, 3);

            // Intro scale animation
            const introStartScale = 15; 
            const introEndScale = 1;
            let scaleFactor = introStartScale - (introStartScale - introEndScale) * ease;

            // Apply scroll-based scaling (shrink as scroll increases)
            const scrollScale = Math.max(0.3, 1 - scrollProgressRef.current * 1.5);
            scaleFactor *= scrollScale;

            const startYRatio = 0.5;
            const endYRatio = shape === 0 ? 0.5 : 0.2; 
            const currentYRatio = startYRatio - (startYRatio - endYRatio) * ease;

            const baseSize = Math.min(width, height) * 0.35;
            const currentSize = baseSize * scaleFactor;
            
            // Apply horizontal offset to center point
            const cx = (width / 2) + (width * horizontalOffset * ease);
            const cy = height * currentYRatio;

            const isSwiveling = shape === 2;
            const swivelAngle = isSwiveling ? Math.sin(Date.now() / 1000) * 0.2 : 0; 
            const cosSwivel = Math.cos(swivelAngle);
            const sinSwivel = Math.sin(swivelAngle);

            particlesRef.current.forEach(p => {
                let bx = p.baseX;
                let by = p.baseY;

                if (isSwiveling) {
                    const rx = bx * cosSwivel - by * sinSwivel;
                    const ry = bx * sinSwivel + by * cosSwivel;
                    bx = rx;
                    by = ry;
                    
                    const tilt = -0.3; 
                    const tx = bx * Math.cos(tilt) - by * Math.sin(tilt);
                    const ty = bx * Math.sin(tilt) + by * Math.cos(tilt);
                    bx = tx;
                    by = ty;
                }

                const targetX = (bx * currentSize) + cx + p.scatterX * scaleFactor; 
                const targetY = (by * currentSize) + cy + p.scatterY * scaleFactor;

                if (p.x === 0 && p.y === 0) {
                    p.x = (p.baseX * baseSize * 15) + cx;
                    p.y = (p.baseY * baseSize * 15) + (height * 0.5);
                }

                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < MOUSE_RADIUS) {
                    const angle = Math.atan2(dy, dx);
                    const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
                    const repulsion = force * 20; 
                    p.vx -= Math.cos(angle) * repulsion;
                    p.vy -= Math.sin(angle) * repulsion;
                }

                const homeDx = targetX - p.x;
                const homeDy = targetY - p.y;
                const speed = progress < 1 ? 0.2 : RETURN_SPEED;

                p.vx += homeDx * speed;
                p.vy += homeDy * speed;
                p.vx *= DAMPING;
                p.vy *= DAMPING;
                
                p.x += p.vx;
                p.y += p.vy;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * scaleFactor, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });

            animationFrameIdRef.current = requestAnimationFrame(draw);
        };

        const handleResize = () => initParticles();
        const handleMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
        const handleMouseLeave = () => { mouse.x = -1000; mouse.y = -1000; };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        initParticles();
        draw();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameIdRef.current);
        };
    }, [density, shape, horizontalOffset]); 

    useEffect(() => {
        if (particlesRef.current.length > 0) {
            const styles = getComputedStyle(document.documentElement);
            const accent = styles.getPropertyValue('--accent').trim() || '#3b82f6';
            const secondary = styles.getPropertyValue('--text-secondary').trim() || '#64748b';
            
            particlesRef.current.forEach(p => {
                p.color = Math.random() > 0.6 ? accent : secondary;
            });
        }
    }, [theme]);

    return <canvas ref={canvasRef} className="fixed inset-0 z-10 pointer-events-auto" />;
};

export default InfinityParticlesAnimation;
