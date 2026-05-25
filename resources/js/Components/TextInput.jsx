import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white shadow-sm placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-0 ' +
                className
            }
            ref={localRef}
        />
    );
});
