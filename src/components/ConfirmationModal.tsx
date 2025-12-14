'use client';

import React, { useEffect, useState } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'warning';
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info',
    onConfirm,
    onCancel,
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setTimeout(() => setIsVisible(false), 200);
        }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    const getConfirmButtonStyles = () => {
        const baseStyle = {
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.95rem',
            transition: 'background 0.2s',
        };

        switch (type) {
            case 'danger':
                return { ...baseStyle, background: '#ef4444' }; // red-500
            case 'warning':
                return { ...baseStyle, background: '#f59e0b' }; // amber-500
            case 'info':
            default:
                return { ...baseStyle, background: '#3b82f6' }; // blue-500
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isVisible ? 'rgba(0,0,0,0.5)' : 'transparent',
                transition: 'background 0.2s ease-in-out',
                backdropFilter: 'blur(4px)',
            }}
            onClick={onCancel} // Click outside to cancel
        >
            <div
                onClick={(e) => e.stopPropagation()} // Prevent click propagation
                style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '24px',
                    borderRadius: '16px',
                    width: '90%',
                    maxWidth: '400px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
                    opacity: isVisible ? 1 : 0,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                <h3
                    style={{
                        margin: '0 0 12px 0',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: type === 'danger' ? '#b91c1c' : '#1e293b',
                    }}
                >
                    {title}
                </h3>
                <p
                    style={{
                        margin: '0 0 24px 0',
                        color: '#64748b',
                        lineHeight: '1.5',
                        fontSize: '1rem',
                    }}
                >
                    {message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: 'white',
                            color: '#475569',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.95rem',
                            transition: 'background 0.2s',
                        }}
                    >
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} style={getConfirmButtonStyles()}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
