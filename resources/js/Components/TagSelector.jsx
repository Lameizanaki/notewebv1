import Icon from '@/Components/Icon';

export default function TagSelector({ tags, selectedTagIds, onChange, onManage }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                        <Icon name="tag" className="h-4 w-4 text-emerald-300" />
                        Tags
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">Select tags for this note.</p>
                </div>
                <button
                    type="button"
                    onClick={onManage}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                    <Icon name="plus" className="h-3.5 w-3.5" />
                    Manage Tags
                </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {tags.length ? (
                    tags.map((tag) => {
                        const active = selectedTagIds.includes(tag.id);

                        return (
                            <label
                                key={tag.id}
                                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition ${
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
                                <Icon name="tag" className="h-3.5 w-3.5" />
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
