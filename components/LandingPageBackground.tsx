
import React, { useEffect, useRef } from 'react';

declare var anime: any;

interface Props {
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const LandingPageBackground: React.FC<Props> = ({ scrollContainerRef }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !scrollContainerRef.current) return;

        const svgEl = svgRef.current;
        
        // Clear previous contents
        while (svgEl.firstChild) {
            svgEl.removeChild(svgEl.firstChild);
        }

        const width = window.innerWidth;
        const height = window.innerHeight * 2.5; // Make it taller to allow for the drawing effect over scroll
        
        const spacing = 50;
        const cols = Math.floor(width / spacing);
        const rows = Math.floor(height / spacing);
        
        const fragment = document.createDocumentFragment();

        // Create a grid of Crosses (+)
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * spacing;
                const y = j * spacing;
                const size = 10; // Size of the cross arms

                // Path for a cross shape
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                // Move to center-top, line to center-bottom, Move to left-center, line to right-center
                const d = `M${x + spacing/2},${y + spacing/2 - size} L${x + spacing/2},${y + spacing/2 + size} M${x + spacing/2 - size},${y + spacing/2} L${x + spacing/2 + size},${y + spacing/2}`;
                
                path.setAttribute("d", d);
                path.setAttribute("stroke", "var(--text-secondary)");
                path.setAttribute("stroke-width", "1");
                path.setAttribute("fill", "none");
                path.setAttribute("opacity", "0.3");
                
                fragment.appendChild(path);
            }
        }
        
        svgEl.appendChild(fragment);

        // Set initial state to hidden (dashoffset)
        const paths = svgEl.querySelectorAll('path');
        
        // Initialize Anime.js animation bound to scroll
        // We set duration to 1 so we can scrub it precisely with seek(0 to 1)
        const animation = anime({
            targets: paths,
            strokeDashoffset: [anime.setDashoffset, 0],
            easing: 'easeInOutSine',
            duration: 1000, // Arbitrary duration, we will seek manually
            delay: anime.stagger(20, { grid: [cols, rows], from: 'center' }),
            autoplay: false 
        });

        const handleScroll = () => {
            if (!scrollContainerRef.current) return;
            const el = scrollContainerRef.current;
            
            // Calculate scroll percentage (0 to 1)
            const maxScroll = el.scrollHeight - el.clientHeight;
            const scrollPercent = Math.min(1, Math.max(0, el.scrollTop / maxScroll));
            
            // Sync animation progress to scroll position
            animation.seek(animation.duration * scrollPercent);
        };

        const container = scrollContainerRef.current;
        container.addEventListener('scroll', handleScroll);
        
        // Initial sync
        handleScroll();

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [scrollContainerRef]);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
            <svg ref={svgRef} className="w-full h-full" style={{ overflow: 'visible' }} />
        </div>
    );
};

export default LandingPageBackground;
