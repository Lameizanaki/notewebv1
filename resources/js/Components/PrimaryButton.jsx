export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-lg border border-transparent bg-emerald-400 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-emerald-300 focus:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    disabled ? 'cursor-not-allowed opacity-60' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
