import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const IDLE_TIMEOUT = 60000; // 1 minute of inactivity
const SYNC_INTERVAL = 30000; // Sync with DB every 30 seconds

export function useActiveTimer(
    profileId: string | undefined,
    isApproved: boolean | undefined,
    multiplier: number = 1
) {
    const [seconds, setSeconds] = useState(0);
    const [isIdle, setIsIdle] = useState(false);
    const lastActivityRef = useRef(Date.now());
    const secondsRef = useRef(0);
    const accumulatedRef = useRef(0);
    const multiplierRef = useRef(multiplier);

    // Keep multiplier ref in sync
    useEffect(() => {
        multiplierRef.current = multiplier;
    }, [multiplier]);

    // Initial fetch of total time
    useEffect(() => {
        if (!profileId || !isApproved) return;

        const fetchInitialTime = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('total_active_seconds')
                    .eq('id', profileId)
                    .single();

                if (!error && data) {
                    const total = Number((data as any).total_active_seconds || 0);
                    setSeconds(Math.floor(total));
                    secondsRef.current = total;
                }
            } catch (e) {
                console.error('Error fetching active time:', e);
            }
        };

        fetchInitialTime();
    }, [profileId, isApproved]);

    // Timer and Activity Tracking
    useEffect(() => {
        if (!profileId || !isApproved) return;

        const handleActivity = () => {
            lastActivityRef.current = Date.now();
            if (isIdle) setIsIdle(false);
        };

        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach(event => document.addEventListener(event, handleActivity));

        const interval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivityRef.current;

            // Check if user is active (tab visible AND not idle)
            if (document.visibilityState === 'visible' && timeSinceLastActivity < IDLE_TIMEOUT) {
                const increment = multiplierRef.current;
                secondsRef.current += increment;
                accumulatedRef.current += increment;
                setSeconds(Math.floor(secondsRef.current));
            } else if (timeSinceLastActivity >= IDLE_TIMEOUT) {
                setIsIdle(true);
            }
        }, 1000);

        // Periodic Sync
        const syncInterval = setInterval(() => {
            if (accumulatedRef.current >= 1) {
                syncToDb();
            }
        }, SYNC_INTERVAL);

        const syncToDb = async () => {
            if (accumulatedRef.current < 1) return;
            const toAdd = Math.floor(accumulatedRef.current);
            accumulatedRef.current -= toAdd; // Keep the remainder

            try {
                // We use an RPC or increment logic if possible,
                // but since we don't have custom RPCs for this yet,
                // we'll fetch latest and update or just trust our local state.
                // Using a simple update for now.
                const { data: latest } = await supabase
                    .from('profiles')
                    .select('total_active_seconds')
                    .eq('id', profileId)
                    .single();

                const newTotal = Number((latest as any)?.total_active_seconds || 0) + toAdd;

                await supabase
                    .from('profiles')
                    .update({ total_active_seconds: newTotal } as any)
                    .eq('id', profileId);
            } catch (e) {
                console.error('Error syncing active time:', e);
                accumulatedRef.current += toAdd; // Revert on failure
            }
        };

        // Final sync on unmount/unload
        window.addEventListener('beforeunload', syncToDb);

        return () => {
            clearInterval(interval);
            clearInterval(syncInterval);
            activityEvents.forEach(event => document.removeEventListener(event, handleActivity));
            window.removeEventListener('beforeunload', syncToDb);
            syncToDb();
        };
    }, [profileId, isApproved, isIdle]);

    return { seconds, isIdle };
}
