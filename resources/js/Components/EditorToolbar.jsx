import Icon from '@/Components/Icon';

const buttons = [
    { label: 'Bold', icon: 'bold', action: 'bold' },
    { label: 'Italic', icon: 'italic', action: 'italic' },
    { label: 'Underline', icon: 'underline', action: 'underline' },
    { label: 'Strike', icon: 'strikethrough', action: 'strike' },
    { label: 'H1', icon: 'text', action: 'heading' },
    { label: 'H2', icon: 'text', action: 'subheading' },
    { label: 'Align left', icon: 'alignLeft', action: 'alignLeft' },
    { label: 'Align center', icon: 'alignCenter', action: 'alignCenter' },
    { label: 'Align right', icon: 'alignRight', action: 'alignRight' },
    { label: 'Bullets', icon: 'bulletList', action: 'bullets' },
    { label: 'Numbered', icon: 'numberList', action: 'numbered' },
    { label: 'Paragraph', icon: 'text', action: 'paragraph' },
];

export default function EditorToolbar({
    isPinned,
    state,
    onFormat,
    onOpenOcr,
    onDictation,
}) {
    return (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 p-2">
            {buttons.map((button) => (
                <button
                    key={button.action}
                    type="button"
                    onClick={() => onFormat(button.action)}
                    className={`inline-flex h-9 items-center justify-center rounded-lg border px-2.5 text-xs transition hover:border-slate-500 hover:text-white ${
                        state?.[button.action] || state?.block === (button.action === 'heading' ? 'h2' : button.action === 'subheading' ? 'h3' : button.action === 'paragraph' ? 'p' : '')
                            ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-100'
                            : 'border-slate-700 text-slate-300'
                    }`}
                    title={button.label}
                    aria-label={button.label}
                >
                    <Icon name={button.icon} className="h-4 w-4" />
                </button>
            ))}
            <button
                type="button"
                onClick={onOpenOcr}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-2.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
                <Icon name="fileText" className="h-4 w-4" />
                OCR
            </button>
            <button
                type="button"
                onClick={onDictation}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-2.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
                <Icon name="mic" className="h-4 w-4" />
                Dictate
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
