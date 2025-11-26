import React, { useEffect, useRef, memo } from 'react';

declare var anime: any;

const GridStrobeAnimation: React.FC = () => {
    const animationWrapper = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!animationWrapper.current || typeof anime === 'undefined') {
            return;
        }

        const wrapperEl = animationWrapper.current;
        let animation: any = null;

        const createAnimation = () => {
            if (animation) {
                animation.pause();
            }
            while (wrapperEl.firstChild) {
                wrapperEl.removeChild(wrapperEl.firstChild);
            }

            const columns = Math.floor(wrapperEl.clientWidth / 25);
            const rows = Math.floor(wrapperEl.clientHeight / 25);
            
            if (columns <= 0 || rows <= 0) return;

            wrapperEl.style.setProperty('--columns', String(columns));
            wrapperEl.style.setProperty('--rows', String(rows));

            Array.from(Array(columns * rows)).forEach(() => {
                const tile = document.createElement('div');
                tile.classList.add('strobe-tile');
                wrapperEl.appendChild(tile);
            });

            animation = anime({
                targets: '.strobe-tile',
                opacity: [
                    { value: 'var(--anime-tile-opacity)', easing: 'easeOutSine', duration: 300 },
                    { value: 0, easing: 'easeInQuad', duration: 1200 }
                ],
                scale: [
                    { value: 0.8, easing: 'easeOutSine', duration: 300 },
                    { value: 1, easing: 'easeInOutQuad', duration: 1200 }
                ],
                delay: anime.stagger(100, { grid: [columns, rows], from: 'random' }),
                loop: true,
            });
        };

        createAnimation();
        const resizeObserver = new ResizeObserver(createAnimation);
        resizeObserver.observe(wrapperEl);

        return () => {
            resizeObserver.disconnect();
            if (animation) {
                animation.pause();
                if (wrapperEl && wrapperEl.childNodes.length > 0) {
                    anime.remove(wrapperEl.childNodes);
                }
                animation = null;
            }
        };

    }, []);

    return <div ref={animationWrapper} className="grid-strobe-background"></div>;
};

export default memo(GridStrobeAnimation);