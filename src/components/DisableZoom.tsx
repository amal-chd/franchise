'use client';

import { useEffect } from 'react';

export default function DisableZoom() {
    useEffect(() => {
        // Prevent pinch-to-zoom
        const handleGestureStart = (e: Event) => {
            e.preventDefault();
        };

        const handleGestureChange = (e: Event) => {
            e.preventDefault();
        };

        const handleGestureEnd = (e: Event) => {
            e.preventDefault();
        };

        // Prevent double-tap to zoom
        let lastTouchEnd = 0;
        const handleTouchEnd = (e: TouchEvent) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        };

        document.addEventListener('gesturestart', handleGestureStart);
        document.addEventListener('gesturechange', handleGestureChange);
        document.addEventListener('gestureend', handleGestureEnd);
        document.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            document.removeEventListener('gesturestart', handleGestureStart);
            document.removeEventListener('gesturechange', handleGestureChange);
            document.removeEventListener('gestureend', handleGestureEnd);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    return null;
}
