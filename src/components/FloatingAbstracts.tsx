'use client';

import { useEffect, useRef } from 'react';

interface Particle {
    element: HTMLDivElement;
    x: number;
    y: number;
    vx: number;
    vy: number;
    baseX: number;
    baseY: number;
    size: number;
}

export default function FloatingAbstracts() {
    const containerRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: 0, y: 0, active: false });
    const animationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Get container dimensions
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;

        // Create particles
        const particleCount = 80;
        const particles: Particle[] = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');

            // Random size between 3-8px
            const size = Math.random() * 5 + 3;

            // Random position within container
            const x = Math.random() * containerWidth;
            const y = Math.random() * containerHeight;

            // Random shape type
            const shapeType = Math.random();
            let shape = '';

            if (shapeType < 0.3) {
                // Small circle
                shape = '50%';
            } else if (shapeType < 0.6) {
                // Small diamond/square rotated
                shape = '20%';
            } else {
                // Rounded rectangle
                shape = '30%';
            }

            // Blue shades matching Google Antigravity style
            const blueShades = [
                '#3B82F6',
                '#2563EB',
                '#60A5FA',
                '#1D4ED8',
                '#93C5FD',
            ];
            const color = blueShades[Math.floor(Math.random() * blueShades.length)];

            particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${shape};
        pointer-events: none;
        opacity: 0.6;
        transform: translate(${x}px, ${y}px) rotate(${Math.random() * 360}deg);
        transition: opacity 0.3s ease;
        will-change: transform;
      `;

            container.appendChild(particle);

            particles.push({
                element: particle,
                x,
                y,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                baseX: x,
                baseY: y,
                size
            });
        }

        particlesRef.current = particles;

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                active: true
            };
        };

        // Touch move handler
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                const rect = container.getBoundingClientRect();
                mouseRef.current = {
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top,
                    active: true
                };
            }
        };

        const handleMouseLeave = () => {
            mouseRef.current.active = false;
        };

        // Animation loop with smoother physics
        const animate = () => {
            particles.forEach((particle) => {
                // Calculate distance from mouse
                if (mouseRef.current.active) {
                    const dx = mouseRef.current.x - particle.x;
                    const dy = mouseRef.current.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Smoother repulsion effect
                    const repulsionRadius = 180;
                    if (distance < repulsionRadius && distance > 0) {
                        const force = (repulsionRadius - distance) / repulsionRadius;
                        const angle = Math.atan2(dy, dx);

                        // Gentler push away from mouse
                        particle.vx -= Math.cos(angle) * force * 1.5;
                        particle.vy -= Math.sin(angle) * force * 1.5;
                    }
                }

                // Apply gentle drift back to base position
                const returnForce = 0.008;
                particle.vx += (particle.baseX - particle.x) * returnForce;
                particle.vy += (particle.baseY - particle.y) * returnForce;

                // Higher damping for smoother movement
                particle.vx *= 0.98;
                particle.vy *= 0.98;

                // Much subtler random drift
                particle.vx += (Math.random() - 0.5) * 0.02;
                particle.vy += (Math.random() - 0.5) * 0.02;

                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Keep particles within container bounds with wrapping
                const rect = container.getBoundingClientRect();
                if (particle.x < -50) particle.x = rect.width + 50;
                if (particle.x > rect.width + 50) particle.x = -50;
                if (particle.y < -50) particle.y = rect.height + 50;
                if (particle.y > rect.height + 50) particle.y = -50;

                // Apply smooth transform with rotation based on velocity
                const rotation = Math.atan2(particle.vy, particle.vx) * (180 / Math.PI);
                particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px) rotate(${rotation}deg)`;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        // Start animation
        animate();

        // Add event listeners to container instead of window
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
        container.addEventListener('mouseleave', handleMouseLeave);

        // Cleanup
        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            particles.forEach(p => p.element.remove());
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                overflow: 'hidden'
            }}
        />
    );
}
