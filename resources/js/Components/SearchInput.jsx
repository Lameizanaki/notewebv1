import Icon from '@/Components/Icon';

export default function SearchInput({ value, onChange, placeholder = 'Search notes by title...' }) {
    return (
        <div className="relative w-full min-w-0 flex-1">
            <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-0"
            />
        </div>
    );
}
