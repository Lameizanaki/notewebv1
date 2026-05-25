export default function FilterDropdown({ value, options, onChange }) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-0"
        >
            <option value="">All tags</option>
            {options.map((tag) => (
                <option key={tag.id} value={tag.id}>
                    {tag.name}
                </option>
            ))}
        </select>
    );
}
