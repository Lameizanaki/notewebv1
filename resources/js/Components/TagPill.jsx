import Icon from '@/Components/Icon';

export default function TagPill({ tag, removable = false, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200">
            <Icon name="tag" className="h-3.5 w-3.5 text-slate-400" />
            #{tag.name}
            {removable ? (
                <button
                    type="button"
                    onClick={onRemove}
                    className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm text-slate-400 transition hover:bg-slate-700 hover:text-white"
                    aria-label={`Remove ${tag.name}`}
                >
                    x
                </button>
            ) : null}
        </span>
    );
}
