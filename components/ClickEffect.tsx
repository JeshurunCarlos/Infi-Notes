
import React, { useEffect, useState } from 'react';

interface Ripple {
    x: number;
    y: number;
    id: number;
}

const ClickEffect: React.FC = () => {
    const [ripples, setRipples] = useState<Ripple[]>([]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const id = Date.now();
            const newRipple = {
                x: e.clientX,
                y: e.clientY,
                id
            };
            setRipples(prev => [...prev, newRipple]);

            // Clean up ripple after animation
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== id));
            }, 600);
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <>
            {ripples.map(ripple => (
                <div
                    key={ripple.id}
                    className="click-ripple"
                    style={{
                        top: ripple.y,
                        left: ripple.x,
                    }}
                />
            ))}
        </>
    );
};

export default ClickEffect;
