import { useEffect, useRef } from 'react';

export function useDebouncedSearch(value, onSearch, delay = 350) {
    const initialRenderRef = useRef(true);
    const onSearchRef = useRef(onSearch);
    onSearchRef.current = onSearch;

    useEffect(() => {
        if (initialRenderRef.current) {
            initialRenderRef.current = false;
            return undefined;
        }

        const timer = window.setTimeout(() => onSearchRef.current(value), delay);

        return () => window.clearTimeout(timer);
    }, [delay, value]);
}
