import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Auto-save hook with debounce.
 *
 * @param {object} options
 * @param {() => Promise<void>} options.onSave   Async function that performs the save.
 * @param {number}  [options.delay=2000]          Debounce delay in ms.
 * @param {boolean} [options.enabled=true]        Whether auto-save is active.
 *
 * @returns {{ status: string, trigger: () => void, saveNow: () => Promise<void> }}
 *   - status   – '' | 'saving' | 'saved' | 'error'
 *   - trigger  – call on every data change to schedule a debounced save
 *   - saveNow  – skip the debounce and save immediately (e.g. on tab switch)
 */
export function useAutoSave({ onSave, delay = 2000, enabled = true }) {
    const [status, setStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'
    const timerRef = useRef(null);
    const onSaveRef = useRef(onSave);
    const pendingRef = useRef(false); // true when a debounced save is scheduled

    // Keep the callback ref up-to-date without re-scheduling
    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);

    const executeSave = useCallback(async () => {
        pendingRef.current = false;
        setStatus('saving');
        try {
            await onSaveRef.current();
            setStatus('saved');
        } catch {
            setStatus('error');
        }
    }, []);

    const trigger = useCallback(() => {
        if (!enabled) return;

        pendingRef.current = true;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        setStatus('');

        timerRef.current = setTimeout(executeSave, delay);
    }, [enabled, delay, executeSave]);

    /** Flush any pending debounced save immediately. Safe to call even when idle. */
    const saveNow = useCallback(async () => {
        if (!enabled || !pendingRef.current) return;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        await executeSave();
    }, [enabled, executeSave]);

    // Clean up timer on unmount
    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    return { status, trigger, saveNow };
}
