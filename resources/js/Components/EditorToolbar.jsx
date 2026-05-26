const buttons = [
    { label: 'B', action: 'bold' },
    { label: 'I', action: 'italic' },
    { label: 'U', action: 'underline' },
    { label: 'S', action: 'strike' },
    { label: 'H1', action: 'heading' },
    { label: 'H2', action: 'subheading' },
    { label: 'Left', action: 'alignLeft' },
    { label: 'Center', action: 'alignCenter' },
    { label: 'Right', action: 'alignRight' },
    { label: 'Bullets', action: 'bullets' },
    { label: 'Numbered', action: 'numbered' },
    { label: 'Text', action: 'paragraph' },
];

export default function EditorToolbar({
    isPinned,
    state,
    onFormat,
    onOpenOcr,
    onDictation,
    onAutoFormat,
}) {
    return (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
            {buttons.map((button) => (
                <button
                    key={button.action}
                    type="button"
                    onClick={() => onFormat(button.action)}
                    className={`rounded-xl border px-3 py-2 text-xs transition hover:border-slate-500 hover:text-white ${
                        state?.[button.action] || state?.block === (button.action === 'heading' ? 'h2' : button.action === 'subheading' ? 'h3' : button.action === 'paragraph' ? 'p' : '')
                            ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-100'
                            : 'border-slate-700 text-slate-300'
                    }`}
                >
                    {button.label}
                </button>
            ))}
            <button
                type="button"
                onClick={onOpenOcr}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
                OCR Upload
            </button>
            <button
                type="button"
                onClick={onDictation}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
                Microphone Dictation
            </button>
            <button
                type="button"
                onClick={onAutoFormat}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
                Auto Format
            </button>
            <span
                className={`ml-auto inline-flex items-center rounded-full px-3 py-2 text-xs ${
                    isPinned ? 'bg-amber-400/10 text-amber-200' : 'bg-slate-800 text-slate-400'
                }`}
            >
                {isPinned ? 'Pinned' : 'Not pinned'}
            </span>
        </div>
    );
}
