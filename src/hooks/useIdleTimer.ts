import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_BEFORE_TIMEOUT = 1 * 60 * 1000; // Warn 1 minute before logging out

export const useIdleTimer = () => {
    const { isAuthenticated, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const timeoutRef = useRef<NodeJS.Timeout>();
    const warningRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!isAuthenticated) return;

        const handleActivity = () => {
            clearTimeout(timeoutRef.current);
            clearTimeout(warningRef.current);

            // Set a warning toast
            warningRef.current = setTimeout(() => {
                toast.warning('Your session will expire in 1 minute due to inactivity.');
            }, IDLE_TIMEOUT - WARNING_BEFORE_TIMEOUT);

            // Set actual logout
            timeoutRef.current = setTimeout(() => {
                clearAuth();
                navigate('/login');
                toast.error('You have been logged out due to inactivity.');
            }, IDLE_TIMEOUT);
        };

        // Track user activity
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        // Initialize timers
        handleActivity();

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            clearTimeout(timeoutRef.current);
            clearTimeout(warningRef.current);
        };
    }, [isAuthenticated, clearAuth, navigate]);
};
