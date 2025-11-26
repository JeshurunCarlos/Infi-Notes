import React, { useEffect, useRef, memo } from 'react';

declare var anime: any;

const AnimeBackground: React.FC = () => {
    const animationWrapper = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!animationWrapper.current || typeof anime === 'undefined') {
            return;
        }

        const wrapperEl = animationWrapper.current;

        const createAnimation = () => {
            // Stop and clear previous animations/elements
            if (wrapperEl.childNodes.length > 0) {
                anime.remove(wrapperEl.childNodes);
            }
            while (wrapperEl.firstChild) {
                wrapperEl.removeChild(wrapperEl.firstChild);
            }

            // Recalculate grid
            const columns = Math.floor(wrapperEl.clientWidth / 30);
            const rows = Math.floor(wrapperEl.clientHeight / 30);

            if (columns <= 0 || rows <= 0) return;

            wrapperEl.style.setProperty('--columns', String(columns));
            wrapperEl.style.setProperty('--rows', String(rows));

            // Create tiles
            Array.from(Array(columns * rows)).forEach(() => {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                wrapperEl.appendChild(tile);
            });

            // Function for individual tile's perpetual random animation
            const animateTile = (tile: Node) => {
                anime({
                    targets: tile,
                    translateX: anime.random(-10, 10),
                    translateY: anime.random(-10, 10),
                    rotate: anime.random(-20, 20),
                    scale: anime.random(0.5, 1.5),
                    duration: anime.random(500, 1500),
                    easing: 'easeInOutSine',
                    direction: 'alternate',
                    loop: true
                });
            };

            // Initial fade-in animation, which then kicks off the perpetual individual animations
            anime({
                targets: wrapperEl.childNodes,
                opacity: [0, 'var(--anime-tile-opacity)'],
                delay: anime.stagger(50, { grid: [columns, rows], from: 'center' }),
                duration: 1000,
                easing: 'easeInOutQuad',
                begin: () => {
                     // Start the individual looping animations as the fade-in begins
                     wrapperEl.childNodes.forEach(tile => {
                         animateTile(tile);
                     });
                }
            });
        };
        
        createAnimation();
        
        const resizeObserver = new ResizeObserver(createAnimation);
        resizeObserver.observe(wrapperEl);

        return () => {
            resizeObserver.disconnect();
            if (wrapperEl && wrapperEl.childNodes.length > 0) {
                anime.remove(wrapperEl.childNodes);
            }
        };

    }, []);

    return <div ref={animationWrapper} className="anime-background"></div>;
};

export default memo(AnimeBackground);