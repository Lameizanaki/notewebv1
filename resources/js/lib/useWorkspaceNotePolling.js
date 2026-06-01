import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_INTERVAL = 3000;

export function useWorkspaceNotePolling({
    workspaceId,
    noteId,
    initialVersion = 0,
    canApply = () => true,
    onSnapshot,
    interval = DEFAULT_INTERVAL,
}) {
    const versionRef = useRef(Number(initialVersion) || 0);
    const canApplyRef = useRef(canApply);
    const onSnapshotRef = useRef(onSnapshot);

    canApplyRef.current = canApply;
    onSnapshotRef.current = onSnapshot;

    const markVersion = useCallback((version) => {
        versionRef.current = Math.max(versionRef.current, Number(version) || 0);
    }, []);

    useEffect(() => {
        let disposed = false;
        let requestInProgress = false;

        const poll = async () => {
            if (
                disposed
                || requestInProgress
                || document.visibilityState === 'hidden'
                || !canApplyRef.current()
            ) {
                return;
            }

            requestInProgress = true;

            try {
                const response = await fetch(route('workspaces.notes.snapshot', [workspaceId, noteId]), {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok || disposed) {
                    return;
                }

                const { note } = await response.json();
                const nextVersion = Number(note?.sync_version) || 0;

                if (
                    nextVersion <= versionRef.current
                    || !canApplyRef.current()
                ) {
                    return;
                }

                versionRef.current = nextVersion;
                onSnapshotRef.current(note);
            } catch {
                // The next polling interval retries transient network failures.
            } finally {
                requestInProgress = false;
            }
        };

        const timer = window.setInterval(poll, interval);

        return () => {
            disposed = true;
            window.clearInterval(timer);
        };
    }, [interval, noteId, workspaceId]);

    return { markVersion };
}
