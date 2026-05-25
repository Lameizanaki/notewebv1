export default function TagPill({ tag, removable = false, onRemove }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-200">
            #{tag.name}
            {removable ? (
                <button type="button" onClick={onRemove} className="text-slate-400 transition hover:text-white">
                    x
                </button>
            ) : null}
        </span>
    );
}
