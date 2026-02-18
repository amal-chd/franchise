'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAKE_REGISTRATIONS = [
    { name: 'Amit Kumar', city: 'Delhi' },
    { name: 'Sarah Joseph', city: 'Mumbai' },
    { name: 'Rahul Nair', city: 'Bangalore' },
    { name: 'Priya Menon', city: 'Hyderabad' },
    { name: 'Arjun Das', city: 'Chennai' },
    { name: 'Fatima S.', city: 'Kolkata' },
    { name: 'Vimal Raj', city: 'Ahmedabad' },
    { name: 'Sneha P.', city: 'Pune' },
    { name: 'Rohan Mehta', city: 'Jaipur' },
    { name: 'Karthik S.', city: 'Kochi' }
];

export default function LiveRegistrations() {
    const [currentReg, setCurrentReg] = useState<typeof FAKE_REGISTRATIONS[0] | null>(null);

    useEffect(() => {
        // Check if already shown in this session
        const hasSeen = sessionStorage.getItem('hasSeenLiveRegistration');
        if (hasSeen) return;

        // Initial delay
        const initialTimeout = setTimeout(() => {
            triggerNotification();
        }, 3000);

        const triggerNotification = () => {
            const randomReg = FAKE_REGISTRATIONS[Math.floor(Math.random() * FAKE_REGISTRATIONS.length)];
            setCurrentReg(randomReg);

            // Mark as seen immediately so it doesn't show again on refresh/nav
            sessionStorage.setItem('hasSeenLiveRegistration', 'true');

            // Hide after 5 seconds
            setTimeout(() => {
                setCurrentReg(null);
            }, 5000);
        };

        return () => clearTimeout(initialTimeout);
    }, []);

    return (
        <AnimatePresence>
            {currentReg && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: 0 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: 20, x: 0 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="fixed bottom-6 left-6 z-50 bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-sm pointer-events-none"
                >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center relative">
                        <i className="fas fa-check text-green-600"></i>
                        <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">New Franchise Request!</p>
                        <p className="text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">{currentReg.name}</span> from {currentReg.city} just applied.
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
