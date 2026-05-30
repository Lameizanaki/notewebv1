import Icon from '@/Components/Icon';

export default function SearchInput({ value, onChange, onSubmit, placeholder = 'Search notes by title...' }) {
    return (
        <form onSubmit={onSubmit} className="flex w-full gap-2">
            <div className="relative min-w-0 flex-1">
                <Icon
                    name="search"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-0"
                />
            </div>
            <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
                <Icon name="search" className="h-4 w-4" />
                Search
            </button>
        </form>
    );
}
