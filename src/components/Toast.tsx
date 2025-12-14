'use client';

import React, { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation frame to slide in
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const getBackgroundColor = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'rgba(220, 252, 231, 0.9)'; // green-100 equivalent with opacity
            case 'error':
                return 'rgba(254, 226, 226, 0.9)'; // red-100
            case 'info':
                return 'rgba(224, 242, 254, 0.9)'; // blue-100
            case 'warning':
                return 'rgba(254, 243, 199, 0.9)'; // amber-100
            default:
                return 'rgba(255, 255, 255, 0.9)';
        }
    };

    const getBorderColor = (type: ToastType) => {
        switch (type) {
            case 'success':
                return '#22c55e'; // green-500
            case 'error':
                return '#ef4444'; // red-500
            case 'info':
                return '#3b82f6'; // blue-500
            case 'warning':
                return '#f59e0b'; // amber-500
            default:
                return '#e2e8f0';
        }
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <i className="fas fa-check-circle" style={{ color: '#15803d' }}></i>;
            case 'error':
                return <i className="fas fa-exclamation-circle" style={{ color: '#b91c1c' }}></i>;
            case 'info':
                return <i className="fas fa-info-circle" style={{ color: '#1d4ed8' }}></i>;
            case 'warning':
                return <i className="fas fa-exclamation-triangle" style={{ color: '#b45309' }}></i>;
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                borderRadius: '12px',
                background: getBackgroundColor(type),
                border: `1px solid ${getBorderColor(type)}`,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                marginTop: '8px',
                maxWidth: '350px',
                transform: isVisible ? 'translateX(0)' : 'translateX(-100%)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                cursor: 'pointer',
            }}
            onClick={onClose}
        >
            <div style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
                {getIcon(type)}
            </div>
            <div>
                <p style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: '#1e293b',
                    lineHeight: '1.4'
                }}>
                    {message}
                </p>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px',
                    marginLeft: 'auto',
                    fontSize: '0.9rem'
                }}
            >
                <i className="fas fa-times"></i>
            </button>
        </div>
    );
};

export default Toast;
