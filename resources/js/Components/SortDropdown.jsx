import Icon from '@/Components/Icon';

export default function SortDropdown({ value, onChange }) {
    return (
        <div className="relative min-w-36">
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-3 pr-9 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-0"
            >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
            </select>
            <Icon
                name="chevronDown"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
        </div>
    );
}
