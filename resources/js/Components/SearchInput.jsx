export default function SearchInput({ value, onChange, onSubmit, placeholder = 'Search notes by title...' }) {
    return (
        <form onSubmit={onSubmit} className="flex w-full gap-3">
            <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-0"
            />
            <button
                type="submit"
                className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
                Search
            </button>
        </form>
    );
}
