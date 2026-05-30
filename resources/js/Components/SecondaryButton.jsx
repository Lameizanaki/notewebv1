export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 shadow-sm transition hover:border-slate-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-25 ${
                    disabled ? 'opacity-25' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
