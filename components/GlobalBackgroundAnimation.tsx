import React from 'react';
import AnimeBackground from './AnimeBackground';
import PulsingDotsAnimation from './PulsingDotsAnimation';
import GridStrobeAnimation from './GridStrobeAnimation';
import FloatingShapesAnimation from './FloatingShapesAnimation';
import MatrixRainAnimation from './MatrixRainAnimation';
import FallingLeavesAnimation from './FallingLeavesAnimation';
import { BackgroundAnimationType } from '../types';

export const GlobalBackgroundAnimation = ({ animationType }: { animationType: BackgroundAnimationType | string }) => {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none">
            {animationType === 'floatingTiles' && <AnimeBackground />}
            {animationType === 'pulsingDots' && <PulsingDotsAnimation />}
            {animationType === 'gridStrobe' && <GridStrobeAnimation />}
            {animationType === 'floatingShapes' && <FloatingShapesAnimation />}
            {animationType === 'matrixRain' && <MatrixRainAnimation />}
            {animationType === 'fallingLeaves' && <FallingLeavesAnimation />}
        </div>
    );
};