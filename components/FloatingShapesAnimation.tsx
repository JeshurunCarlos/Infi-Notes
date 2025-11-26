import React, { useEffect, useRef, memo } from 'react';

declare var anime: any;

const FloatingShapesAnimation: React.FC = () => {
    const animationWrapper = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!animationWrapper.current || typeof anime === 'undefined') {
            return;
        }

        const wrapperEl = animationWrapper.current;
        let animation: any = null;
        const numShapes = 30;

        const createAnimation = () => {
            if (animation) {
                animation.pause();
            }
            while (wrapperEl.firstChild) {
                wrapperEl.removeChild(wrapperEl.firstChild);
            }

            for (let i = 0; i < numShapes; i++) {
                const shape = document.createElement('div');
                shape.classList.add('floating-shape');
                const size = anime.random(20, 80) + 'px';
                shape.style.width = size;
                shape.style.height = size;
                shape.style.left = anime.random(0, 100) + '%';
                wrapperEl.appendChild(shape);
            }

            animation = anime({
                targets: '.floating-shape',
                translateY: [() => wrapperEl.offsetHeight + 100, -100],
                opacity: [
                    { value: 'var(--anime-tile-opacity)', duration: () => anime.random(500, 1500) },
                    { value: 0, duration: () => anime.random(500, 1500), delay: () => anime.random(3000, 6000) }
                ],
                duration: () => anime.random(8000, 16000),
                delay: anime.stagger(300),
                easing: 'linear',
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

    return <div ref={animationWrapper} className="floating-shapes-background"></div>;
};

export default memo(FloatingShapesAnimation);