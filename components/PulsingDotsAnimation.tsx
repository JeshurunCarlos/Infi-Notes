import React, { useEffect, useRef, memo } from 'react';

declare var anime: any;

const PulsingDotsAnimation: React.FC = () => {
    const animationWrapper = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!animationWrapper.current || typeof anime === 'undefined') {
            return;
        }

        const wrapperEl = animationWrapper.current;
        let animation: any = null;

        const createAnimation = () => {
            // Clean up previous animation and elements
            if (animation) {
                animation.pause();
            }
            if (wrapperEl.childNodes.length > 0) {
                anime.remove(wrapperEl.childNodes);
            }
            while (wrapperEl.firstChild) {
                wrapperEl.removeChild(wrapperEl.firstChild);
            }
            
            // Increased density for a more intense effect
            const columns = Math.floor(wrapperEl.clientWidth / 25);
            const rows = Math.floor(wrapperEl.clientHeight / 25);

            if (columns <= 0 || rows <= 0) return;

            wrapperEl.style.setProperty('--columns', String(columns));
            wrapperEl.style.setProperty('--rows', String(rows));

            Array.from(Array(columns * rows)).forEach(() => {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                wrapperEl.appendChild(dot);
            });

            animation = anime({
                targets: '.dot',
                scale: [
                    { value: 0.1, easing: 'easeOutSine', duration: 500 },
                    { value: 2.5, easing: 'easeInOutQuad', duration: 1200 }
                ],
                translateX: () => anime.random(-15, 15),
                translateY: () => anime.random(-15, 15),
                opacity: [
                    { value: 1, easing: 'easeOutSine', duration: 250 },
                    { value: 0, easing: 'easeInQuad', duration: 1450 }
                ],
                delay: anime.stagger(100, { grid: [columns, rows], from: 'center' }),
                loop: true,
                direction: 'alternate',
            });
        };

        createAnimation();

        const resizeObserver = new ResizeObserver(createAnimation);
        resizeObserver.observe(wrapperEl);

        return () => {
            resizeObserver.disconnect();
            if (animation) {
                animation.pause();
                // Ensure to remove animation targets on unmount
                if(wrapperEl && wrapperEl.childNodes.length > 0) {
                   anime.remove(wrapperEl.childNodes);
                }
                animation = null;
            }
        };

    }, []);

    return <div ref={animationWrapper} className="pulsing-dots-background"></div>;
};

export default memo(PulsingDotsAnimation);
