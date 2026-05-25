export default function TagSelector({ tags, selectedTagIds, onChange, onManage }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-medium text-white">Tags</h3>
                    <p className="mt-1 text-xs text-slate-500">Select tags for this note.</p>
                </div>
                <button
                    type="button"
                    onClick={onManage}
                    className="rounded-2xl border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                    Manage Tags
                </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                {tags.length ? (
                    tags.map((tag) => {
                        const active = selectedTagIds.includes(tag.id);

                        return (
                            <label
                                key={tag.id}
                                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs transition ${
                                    active
                                        ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                                        : 'border-slate-700 bg-slate-900 text-slate-300'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={active}
                                    onChange={() => onChange(tag.id)}
                                    className="hidden"
                                />
                                #{tag.name}
                            </label>
                        );
                    })
                ) : (
                    <p className="text-sm text-slate-500">No tags yet. Create one in the tag manager.</p>
                )}
            </div>
        </div>
    );
}
