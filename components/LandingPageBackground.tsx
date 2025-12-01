
import React, { useEffect, useRef } from 'react';

declare var anime: any;

const LandingPageBackground: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || typeof anime === 'undefined') return;

        const svgEl = svgRef.current;
        
        // Clear previous contents
        while (svgEl.firstChild) {
            svgEl.removeChild(svgEl.firstChild);
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Center point
        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.min(width, height) / 2.5;

        // Create the polygon element
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("fill", "none");
        polygon.setAttribute("stroke", "var(--border-primary)");
        polygon.setAttribute("stroke-width", "1");
        polygon.setAttribute("opacity", "0.4");
        svgEl.appendChild(polygon);

        // Function to generate random points for a blob-like shape
        function generatePoints() {
            const numPoints = anime.random(8, 16); // Random number of vertices
            let points = '';
            
            for (let i = 0; i < numPoints; i++) {
                const angle = (Math.PI * 2 * i) / numPoints;
                // Randomize radius for jagged effect
                const radius = anime.random(maxRadius * 0.6, maxRadius);
                
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;
                
                points += `${x},${y} `;
            }
            return points;
        }

        function animateShape() {
            const newPoints = generatePoints();
            
            anime({
                targets: polygon,
                points: [{ value: newPoints }],
                easing: 'easeInOutQuad',
                duration: 2000,
                complete: animateShape
            });
        }

        // Initialize first shape
        const initialPoints = generatePoints();
        polygon.setAttribute("points", initialPoints);

        // Start animation loop
        animateShape();

        // Handle resize to recenter
        const handleResize = () => {
            // A full re-init might be jarring, but we can just update the SVG viewBox if needed
            // For now, let's just let it be or it might need a reload for perfect centering
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            anime.remove(polygon);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <svg ref={svgRef} className="w-full h-full" style={{ overflow: 'visible' }} />
        </div>
    );
};

export default LandingPageBackground;
