import { normalizeEditorHtml, plainTextToHtml, sanitizeEditorHtml } from '@/lib/noteContent';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const defaultState = {
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    bullets: false,
    numbered: false,
    block: 'p',
};

function syncSemanticMode() {
    if (typeof document !== 'undefined' && document.queryCommandSupported?.('styleWithCSS')) {
        document.execCommand('styleWithCSS', false, false);
    }
}

const commandMap = {
    bold: () => document.execCommand('bold'),
    italic: () => document.execCommand('italic'),
    underline: () => document.execCommand('underline'),
    strike: () => document.execCommand('strikeThrough'),
    bullets: () => document.execCommand('insertUnorderedList'),
    numbered: () => document.execCommand('insertOrderedList'),
    paragraph: () => document.execCommand('formatBlock', false, 'p'),
    heading: () => document.execCommand('formatBlock', false, 'h2'),
    subheading: () => document.execCommand('formatBlock', false, 'h3'),
    alignLeft: () => document.execCommand('justifyLeft'),
    alignCenter: () => document.execCommand('justifyCenter'),
    alignRight: () => document.execCommand('justifyRight'),
};

const richTextStyles =
    'min-h-[24rem] w-full rounded-xl border border-slate-700 bg-slate-950/70 px-5 py-5 text-sm leading-7 text-white focus:border-emerald-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-70 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-400/50 [&_blockquote]:pl-4 [&_blockquote]:text-slate-300 [&_h2]:mt-5 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_li]:ml-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_p]:my-3 [&_strong]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_u]:underline';

const readOnlyStyles =
    'min-h-[24rem] rounded-xl border border-slate-800 bg-slate-950/50 px-5 py-5 text-sm leading-7 text-white [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-400/50 [&_blockquote]:pl-4 [&_blockquote]:text-slate-300 [&_h2]:mt-5 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_li]:ml-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_p]:my-3 [&_strong]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_u]:underline';

const placeholderStyles = 'pointer-events-none absolute left-5 top-5 text-sm text-slate-500';

const RichTextEditor = forwardRef(function RichTextEditor(
    { value, onChange, readOnly = false, placeholder = 'Write your note here...', onStateChange },
    ref,
) {
    const editorRef = useRef(null);
    const latestValueRef = useRef('');
    const [isFocused, setIsFocused] = useState(false);
    const [formatState, setFormatState] = useState(defaultState);

    const syncContent = () => {
        if (!editorRef.current) {
            return '';
        }

        const sanitized = sanitizeEditorHtml(editorRef.current.innerHTML);
        latestValueRef.current = sanitized;
        onChange(sanitized);
        return sanitized;
    };

    const updateToolbarState = () => {
        if (!editorRef.current || readOnly) {
            return;
        }

        const selection = window.getSelection();

        if (!selection?.anchorNode || !editorRef.current.contains(selection.anchorNode)) {
            const nextState = defaultState;
            setFormatState(nextState);
            onStateChange?.(nextState);
            return;
        }

        const blockValue = (document.queryCommandValue('formatBlock') || 'p').toString().replace(/[<>]/g, '').toLowerCase();
        const nextState = {
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strike: document.queryCommandState('strikeThrough'),
            bullets: document.queryCommandState('insertUnorderedList'),
            numbered: document.queryCommandState('insertOrderedList'),
            block: blockValue || 'p',
        };

        setFormatState(nextState);
        onStateChange?.(nextState);
    };

    const focusEditor = () => {
        editorRef.current?.focus();
        syncSemanticMode();
    };

    useImperativeHandle(ref, () => ({
        execute(action) {
            if (readOnly || !commandMap[action]) {
                return;
            }

            focusEditor();
            commandMap[action]();
            syncContent();
            updateToolbarState();
        },
        insertText(text) {
            if (readOnly) {
                return;
            }

            focusEditor();

            if (!document.execCommand('insertText', false, text)) {
                document.execCommand('insertHTML', false, plainTextToHtml(text));
            }

            syncContent();
            updateToolbarState();
        },
        autoFormat() {
            if (readOnly || !editorRef.current) {
                return;
            }

            const text = editorRef.current.textContent?.trim() ?? '';
            const match = text.match(/^(##|#|[-*]|\d+[.)])\s+(.+)$/);

            if (!match) {
                return;
            }

            const [, marker, content] = match;
            editorRef.current.textContent = content;

            if (marker === '#') {
                document.execCommand('formatBlock', false, 'h2');
            } else if (marker === '##') {
                document.execCommand('formatBlock', false, 'h3');
            } else if (/^[-*]$/.test(marker)) {
                document.execCommand('insertUnorderedList');
            } else {
                document.execCommand('insertOrderedList');
            }

            syncContent();
            updateToolbarState();
        },
    }));

    useEffect(() => {
        const normalized = normalizeEditorHtml(value ?? '');
        latestValueRef.current = normalized;

        if (!editorRef.current) {
            return;
        }

        if (editorRef.current.innerHTML !== normalized) {
            editorRef.current.innerHTML = normalized || '<p></p>';
        }
    }, [value]);

    useEffect(() => {
        if (readOnly) {
            return undefined;
        }

        const handleSelectionChange = () => updateToolbarState();
        document.addEventListener('selectionchange', handleSelectionChange);

        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [readOnly]);

    if (readOnly) {
        const normalized = normalizeEditorHtml(value ?? '');

        return normalized ? (
            <div className={readOnlyStyles} dangerouslySetInnerHTML={{ __html: normalized }} />
        ) : (
            <div className={readOnlyStyles}>
                <p className="text-slate-500">No content yet.</p>
            </div>
        );
    }

    const currentHtml = latestValueRef.current;
    const isEmpty = !currentHtml || currentHtml === '<p></p>';

    return (
        <div className="relative mt-2">
            {isEmpty && !isFocused ? <div className={placeholderStyles}>{placeholder}</div> : null}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className={richTextStyles}
                onFocus={() => {
                    setIsFocused(true);
                    syncSemanticMode();
                    updateToolbarState();
                }}
                onBlur={() => {
                    setIsFocused(false);
                    syncContent();
                }}
                onInput={() => syncContent()}
            />
        </div>
    );
});

export default RichTextEditor;
