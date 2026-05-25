export default function SortDropdown({ value, onChange }) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-0"
        >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
        </select>
    );
}
