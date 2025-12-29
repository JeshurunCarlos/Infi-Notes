import React, { useEffect, useRef, memo } from 'react';

declare var anime: any;

const SubtleWaveAnimation: React.FC = () => {
    const animationWrapper = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!animationWrapper.current || typeof anime === 'undefined') return;

        const wrapperEl = animationWrapper.current;
        // Clean up
        while (wrapperEl.firstChild) {
            wrapperEl.removeChild(wrapperEl.firstChild);
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        const spacing = 50; // Space between dots
        const cols = Math.ceil(width / spacing);
        const rows = Math.ceil(height / spacing);

        // Create grid dots
        for (let i = 0; i < rows * cols; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const dot = document.createElement('div');
            dot.style.position = 'absolute';
            dot.style.left = `${col * spacing + spacing / 2}px`;
            dot.style.top = `${row * spacing + spacing / 2}px`;
            dot.style.width = '3px';
            dot.style.height = '3px';
            dot.style.backgroundColor = 'var(--text-primary)';
            dot.style.borderRadius = '50%';
            dot.style.opacity = '0.1';
            dot.classList.add('wave-dot'); 
            wrapperEl.appendChild(dot);
        }

        // Animate
        anime({
            targets: '.wave-dot',
            scale: [
                { value: 1, easing: 'easeInOutSine', duration: 2000 },
                { value: 3, easing: 'easeInOutSine', duration: 2000 }
            ],
            opacity: [
                { value: 0.05, easing: 'linear', duration: 2000 },
                { value: 0.3, easing: 'linear', duration: 2000 }
            ],
            translateY: [
                { value: -5, easing: 'easeInOutQuad', duration: 2000 },
                { value: 5, easing: 'easeInOutQuad', duration: 2000 }
            ],
            delay: anime.stagger(100, { grid: [cols, rows], from: 'center' }),
            loop: true,
            direction: 'alternate'
        });

    }, []);

    return <div ref={animationWrapper} className="fixed inset-0 z-0 pointer-events-none opacity-60"></div>;
};

export default memo(SubtleWaveAnimation);