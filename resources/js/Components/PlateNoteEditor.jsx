import Icon from '@/Components/Icon';
import { normalizeEditorHtml, sanitizeEditorHtml } from '@/lib/noteContent';
import {
    BasicBlocksPlugin,
    BasicMarksPlugin,
} from '@platejs/basic-nodes/react';
import { ListPlugin as ListClassicPlugin } from '@platejs/list-classic/react';
import { KEYS } from 'platejs';
import {
    Plate,
    PlateContent,
    PlateElement,
    PlateLeaf,
    createPlatePlugin,
    useEditorRef,
    useEditorSelector,
    usePlateEditor,
} from 'platejs/react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

const AlignmentPlugin = createPlatePlugin({
    key: 'align',
    inject: {
        isBlock: true,
        nodeProps: {
            defaultNodeValue: 'left',
            nodeKey: 'align',
            styleKey: 'textAlign',
            validNodeValues: ['left', 'center', 'right'],
        },
        targetPlugins: [KEYS.p, 'h1', 'h2', 'h3', KEYS.blockquote, 'li', 'lic'],
    },
});

const plugins = [BasicBlocksPlugin, BasicMarksPlugin, ListClassicPlugin, AlignmentPlugin];

const editorShellClassName =
    'min-h-[34rem] rounded-xl border border-slate-800/90 bg-slate-950/70 p-4 shadow-[0_28px_80px_rgba(2,6,23,0.45)]';

const editableClassName =
    'min-h-[26rem] rounded-lg px-4 py-4 text-[15px] leading-8 text-slate-100 outline-none [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300/60 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-slate-300 [&_h1]:mt-7 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:tracking-[-0.03em] [&_h1]:text-white [&_h2]:mt-7 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-[-0.02em] [&_h3]:text-white [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:pl-1 [&_li]:text-slate-100 [&_ul_ol]:mt-2 [&_ul_ul]:mt-2';

const emptyValue = [{ type: 'p', children: [{ text: '' }] }];

function getSafeAlign(align) {
    return ['left', 'center', 'right'].includes(align) ? align : 'left';
}

function getAlignClass(align) {
    const safeAlign = getSafeAlign(align);

    return {
        center: 'text-center',
        right: 'text-right',
        left: 'text-left',
    }[safeAlign];
}

function getAlignStyle(align) {
    return { textAlign: getSafeAlign(align) };
}

function getDomTextAlign(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return 'left';
    }

    return getSafeAlign(element.style?.textAlign);
}

function escapeHtml(value = '') {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function ensureTextChildren(children) {
    return children.length ? children : [{ text: '' }];
}

function deserializeInlineNode(node, marks = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
        return [{ text: node.textContent ?? '', ...marks }];
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return [];
    }

    const tagName = node.tagName.toUpperCase();
    const nextMarks = { ...marks };

    if (tagName === 'BR') {
        return [{ text: '\n', ...marks }];
    }

    if (tagName === 'STRONG' || tagName === 'B') {
        nextMarks.bold = true;
    }

    if (tagName === 'EM' || tagName === 'I') {
        nextMarks.italic = true;
    }

    if (tagName === 'U') {
        nextMarks.underline = true;
    }

    if (tagName === 'S' || tagName === 'STRIKE') {
        nextMarks.strikethrough = true;
    }

    if (tagName === 'CODE') {
        nextMarks.code = true;
    }

    return [...node.childNodes].flatMap((child) => deserializeInlineNode(child, nextMarks));
}

function deserializeListItem(node) {
    const children = [];
    let inlineChildren = [];

    [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE && ['UL', 'OL'].includes(child.tagName.toUpperCase())) {
            if (inlineChildren.length) {
                children.push({ type: 'lic', children: ensureTextChildren(inlineChildren) });
                inlineChildren = [];
            }

            children.push(deserializeBlockNode(child));
            return;
        }

        inlineChildren.push(...deserializeInlineNode(child));
    });

    if (inlineChildren.length || !children.length) {
        children.unshift({ type: 'lic', children: ensureTextChildren(inlineChildren) });
    }

    return {
        type: 'li',
        align: getDomTextAlign(node),
        children,
    };
}

function deserializeBlockNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        return text ? { type: 'p', children: [{ text }] } : null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const tagName = node.tagName.toUpperCase();
    const align = getDomTextAlign(node);

    if (tagName === 'UL' || tagName === 'OL') {
        return {
            type: tagName.toLowerCase(),
            children: [...node.children]
                .filter((child) => child.tagName?.toUpperCase() === 'LI')
                .map((child) => deserializeListItem(child)),
        };
    }

    if (tagName === 'LI') {
        return deserializeListItem(node);
    }

    const typeMap = {
        BLOCKQUOTE: 'blockquote',
        H1: 'h1',
        H2: 'h2',
        H3: 'h3',
        P: 'p',
    };

    return {
        type: typeMap[tagName] ?? 'p',
        align,
        children: ensureTextChildren(deserializeInlineNode(node)),
    };
}

function deserializeHtmlToValue(html = '') {
    if (typeof document === 'undefined') {
        return emptyValue;
    }

    const template = document.createElement('template');
    template.innerHTML = normalizeEditorHtml(html) || '<p></p>';

    const value = [...template.content.childNodes]
        .map((node) => deserializeBlockNode(node))
        .filter(Boolean);

    return value.length ? value : emptyValue;
}

function serializeTextNode(node) {
    let html = escapeHtml(node.text ?? '').replace(/\n/g, '<br>');

    if (node.code) {
        html = `<code>${html}</code>`;
    }

    if (node.bold) {
        html = `<strong>${html}</strong>`;
    }

    if (node.italic) {
        html = `<em>${html}</em>`;
    }

    if (node.underline) {
        html = `<u>${html}</u>`;
    }

    if (node.strikethrough) {
        html = `<s>${html}</s>`;
    }

    return html;
}

function serializeChildren(children = []) {
    return children.map((child) => serializeNode(child)).join('');
}

function alignAttribute(node) {
    const align = getSafeAlign(node.align);

    return align === 'left' ? '' : ` style="text-align: ${align};"`;
}

function serializeNode(node) {
    if ('text' in node) {
        return serializeTextNode(node);
    }

    const children = serializeChildren(node.children);

    switch (node.type) {
        case 'h1':
            return `<h1${alignAttribute(node)}>${children || '<br>'}</h1>`;
        case 'h2':
            return `<h2${alignAttribute(node)}>${children || '<br>'}</h2>`;
        case 'h3':
            return `<h3${alignAttribute(node)}>${children || '<br>'}</h3>`;
        case 'blockquote':
            return `<blockquote${alignAttribute(node)}>${children || '<br>'}</blockquote>`;
        case 'ul':
            return `<ul>${children}</ul>`;
        case 'ol':
            return `<ol>${children}</ol>`;
        case 'li':
            return `<li${alignAttribute(node)}>${children}</li>`;
        case 'lic':
            return children;
        case 'p':
        default:
            return `<p${alignAttribute(node)}>${children || '<br>'}</p>`;
    }
}

function renderElement(props) {
    const { element } = props;
    const alignClass = getAlignClass(element.align);
    const alignStyle = getAlignStyle(element.align);

    switch (element.type) {
        case 'h1':
            return (
                <PlateElement
                    {...props}
                    as="h1"
                    style={alignStyle}
                    className={`mt-7 text-4xl font-semibold tracking-[-0.03em] text-white first:mt-0 ${alignClass}`}
                />
            );
        case 'h2':
            return (
                <PlateElement
                    {...props}
                    as="h2"
                    style={alignStyle}
                    className={`mt-7 text-3xl font-semibold tracking-[-0.02em] text-white first:mt-0 ${alignClass}`}
                />
            );
        case 'h3':
            return (
                <PlateElement
                    {...props}
                    as="h3"
                    style={alignStyle}
                    className={`mt-6 text-xl font-semibold tracking-[-0.02em] text-white first:mt-0 ${alignClass}`}
                />
            );
        case 'blockquote':
            return (
                <PlateElement
                    {...props}
                    as="blockquote"
                    style={alignStyle}
                    className={`my-5 border-l-4 border-emerald-300/60 pl-5 text-[15px] italic leading-8 text-slate-300 ${alignClass}`}
                />
            );
        case 'ul':
            return (
                <PlateElement
                    {...props}
                    as="ul"
                    className="my-4 list-disc space-y-2 pl-6 marker:text-emerald-300"
                />
            );
        case 'ol':
            return (
                <PlateElement
                    {...props}
                    as="ol"
                    className="my-4 list-decimal space-y-2 pl-6 marker:text-emerald-300"
                />
            );
        case 'li':
            return <PlateElement {...props} as="li" style={alignStyle} className={`pl-1 text-slate-100 ${alignClass}`} />;
        case 'lic':
            return <PlateElement {...props} as="div" style={alignStyle} className={`min-w-0 ${alignClass}`} />;
        case 'taskList':
            return (
                <PlateElement
                    {...props}
                    as="ul"
                    className="my-4 list-none space-y-2 pl-0"
                />
            );
        case 'p':
        default:
            return (
                <PlateElement
                    {...props}
                    as="p"
                    style={alignStyle}
                    className={`my-4 text-[15px] leading-8 text-slate-100 first:mt-0 last:mb-0 ${alignClass}`}
                />
            );
    }
}

function renderLeaf(props) {
    const { children, leaf } = props;
    let content = children;

    if (leaf.bold) {
        content = <strong className="font-semibold text-white">{content}</strong>;
    }

    if (leaf.italic) {
        content = <em>{content}</em>;
    }

    if (leaf.underline) {
        content = (
            <span className="underline decoration-emerald-300/80 decoration-2 underline-offset-4">
                {content}
            </span>
        );
    }

    if (leaf.strikethrough) {
        content = <span className="line-through opacity-70">{content}</span>;
    }

    if (leaf.code) {
        content = (
            <code className="rounded-lg bg-slate-800 px-1.5 py-0.5 text-[0.9em] text-emerald-200">
                {content}
            </code>
        );
    }

    return <PlateLeaf {...props}>{content}</PlateLeaf>;
}

function ToolbarButton({ active = false, children, icon, label, onTrigger, title, wide = false }) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onMouseDown={(event) => {
                event.preventDefault();
                onTrigger?.();
            }}
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition ${
                wide ? 'min-w-[4.75rem]' : 'w-9'
            } ${
                active
                    ? 'border-emerald-400/70 bg-emerald-400/12 text-emerald-100'
                    : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500 hover:text-white'
            }`}
        >
            {icon ? <Icon name={icon} className="h-4 w-4" /> : null}
            {children ?? label}
        </button>
    );
}

function PlateToolbar({
    isDictating = false,
    autoCorrectProcessing = false,
    onFormatChange,
    onOpenOcr,
    onRequestDictation,
    onRequestAutoCorrect,
}) {
    const editor = useEditorRef();
    const marks = useEditorSelector((currentEditor) => currentEditor.api.marks?.() ?? {}, []);
    const selection = useEditorSelector((currentEditor) => currentEditor.selection, []);
    const currentBlockType = useEditorSelector((currentEditor) => {
        if (!currentEditor.selection) {
            return currentEditor.getType(KEYS.p);
        }

        const entry = currentEditor.api.node({
            at: currentEditor.selection,
            match: (node) => typeof node === 'object' && node !== null && 'type' in node,
        });

        return entry?.[0]?.type ?? currentEditor.getType(KEYS.p);
    }, [selection]);
    const activeListType = useEditorSelector((currentEditor) => {
        const listEntry = currentEditor.api.above({
            at: currentEditor.selection ?? undefined,
            match: (node) =>
                typeof node === 'object' &&
                node !== null &&
                'type' in node &&
                (node.type === currentEditor.getType('ul') || node.type === currentEditor.getType('ol')),
        });

        return listEntry?.[0]?.type ?? null;
    }, [selection]);
    const currentBlockAlign = useEditorSelector((currentEditor) => {
        const blockEntry = getAlignTargetEntry(currentEditor);

        return getSafeAlign(blockEntry?.[0]?.align);
    }, [selection]);

    const paragraphType = editor.getType(KEYS.p);
    const headingType = editor.getType('h2');
    const subheadingType = editor.getType('h3');
    const bulletedListType = editor.getType('ul');
    const numberedListType = editor.getType('ol');
    const runToggle = (key) => {
        const plugin = editor.getPlugin({ key });
        const transformGroup = plugin?.transforms?.[key];
        transformGroup?.toggle?.();
        editor.tf.focus();
    };
    const resetToParagraph = () => {
        editor.tf.resetBlock();
        editor.tf.focus();
    };
    const setAlignment = (align) => {
        const blockEntry = getAlignTargetEntry(editor);

        if (!blockEntry) {
            return;
        }

        editor.tf.setNodes({ align: getSafeAlign(align) }, { at: blockEntry[1] });
        onFormatChange?.();
        editor.tf.focus();
    };

    return (
        <div className="sticky top-3 z-10 mb-5 flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-950/90 p-2 backdrop-blur">
            <ToolbarButton
                active={!!marks.bold}
                icon="bold"
                title="Bold"
                onTrigger={() => runToggle(KEYS.bold)}
            />
            <ToolbarButton
                active={!!marks.italic}
                icon="italic"
                title="Italic"
                onTrigger={() => runToggle(KEYS.italic)}
            />
            <ToolbarButton
                active={!!marks.underline}
                icon="underline"
                title="Underline"
                onTrigger={() => runToggle(KEYS.underline)}
            />
            <ToolbarButton
                active={!!marks.strikethrough}
                icon="strikethrough"
                title="Strikethrough"
                onTrigger={() => runToggle(KEYS.strikethrough)}
            />
            <div className="mx-1 hidden h-8 w-px bg-slate-800 lg:block" />
            <ToolbarButton
                active={currentBlockType === headingType}
                icon="text"
                title="Heading"
                wide
                onTrigger={() => runToggle('h2')}
            >
                H
            </ToolbarButton>
            <ToolbarButton
                active={currentBlockType === subheadingType}
                icon="text"
                title="Subheading"
                wide
                onTrigger={() => runToggle('h3')}
            >
                H2
            </ToolbarButton>
            <ToolbarButton
                active={currentBlockType === paragraphType}
                icon="text"
                title="Paragraph"
                wide
                onTrigger={resetToParagraph}
            >
                Text
            </ToolbarButton>
            <div className="mx-1 hidden h-8 w-px bg-slate-800 lg:block" />
            <ToolbarButton
                active={currentBlockAlign === 'left'}
                icon="alignLeft"
                title="Align left"
                onTrigger={() => setAlignment('left')}
            />
            <ToolbarButton
                active={currentBlockAlign === 'center'}
                icon="alignCenter"
                title="Align center"
                onTrigger={() => setAlignment('center')}
            />
            <ToolbarButton
                active={currentBlockAlign === 'right'}
                icon="alignRight"
                title="Align right"
                onTrigger={() => setAlignment('right')}
            />
            <div className="mx-1 hidden h-8 w-px bg-slate-800 lg:block" />
            <ToolbarButton
                active={activeListType === bulletedListType}
                icon="bulletList"
                title="Bulleted list"
                onTrigger={() => runToggle('ul')}
            />
            <ToolbarButton
                active={activeListType === numberedListType}
                icon="numberList"
                title="Numbered list"
                onTrigger={() => runToggle('ol')}
            />
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
                onMouseDown={(event) => {
                    event.preventDefault();
                    onRequestDictation?.();
                }}
                className={`inline-flex h-9 items-center gap-2 rounded-lg border px-2.5 text-xs transition ${
                    isDictating
                        ? 'border-rose-400/70 bg-rose-500/10 text-rose-100'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
            >
                <Icon name="mic" className="h-4 w-4" />
                {isDictating ? 'Stop' : 'Dictate'}
            </button>
            <button
                type="button"
                disabled={autoCorrectProcessing}
                onMouseDown={(event) => {
                    event.preventDefault();
                    onRequestAutoCorrect?.();
                }}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-2.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
                <Icon name="sparkles" className="h-4 w-4" />
                {autoCorrectProcessing ? 'Checking...' : 'Auto Correct'}
            </button>
        </div>
    );
}

async function serializeEditor(editor) {
    return sanitizeEditorHtml(serializeChildren(editor.children));
}

function cloneSelection(selection) {
    if (!selection) {
        return null;
    }

    return {
        anchor: {
            path: [...selection.anchor.path],
            offset: selection.anchor.offset,
        },
        focus: {
            path: [...selection.focus.path],
            offset: selection.focus.offset,
        },
    };
}

function isCollapsedSelection(selection) {
    return (
        selection &&
        selection.anchor.offset === selection.focus.offset &&
        selection.anchor.path.length === selection.focus.path.length &&
        selection.anchor.path.every((segment, index) => segment === selection.focus.path[index])
    );
}

function getCurrentBlockEntry(editor) {
    return editor.api.above({
        at: editor.selection ?? undefined,
        match: (node) => typeof node === 'object' && node !== null && editor.api.isBlock(node),
    });
}

function getAlignTargetEntry(editor) {
    const blockEntry = getCurrentBlockEntry(editor);

    if (!blockEntry) {
        return null;
    }

    if (blockEntry[0]?.type !== 'lic') {
        return blockEntry;
    }

    return editor.api.above({
        at: editor.selection ?? undefined,
        match: (node) => typeof node === 'object' && node !== null && node.type === 'li',
    }) ?? blockEntry;
}

function getSpeechRecognitionConstructor() {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

const SAFE_AUTO_CORRECT_CATEGORIES = new Set(['TYPOS', 'GRAMMAR', 'CASING', 'PUNCTUATION', 'CONFUSED_WORDS']);
const SAFE_AUTO_CORRECT_ISSUE_TYPES = new Set(['misspelling', 'grammar', 'typographical']);

function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function samePath(firstPath, secondPath) {
    return firstPath.length === secondPath.length && firstPath.every((segment, index) => segment === secondPath[index]);
}

function collectEditorTextMap(nodes = []) {
    let text = '';
    const map = [];

    const visit = (node, path) => {
        if ('text' in node) {
            const nodeText = node.text ?? '';

            for (let offset = 0; offset < nodeText.length; offset += 1) {
                map[text.length] = { path, offset };
                text += nodeText[offset];
            }
            return;
        }

        (node.children ?? []).forEach((child, index) => visit(child, [...path, index]));
    };

    nodes.forEach((node, index) => {
        if (index > 0) {
            map[text.length] = null;
            text += '\n';
        }

        visit(node, [index]);
    });

    return { text, map };
}

function firstSafeReplacement(match) {
    const original = match.original ?? '';
    const replacement = match.replacements?.[0] ?? '';

    if (!replacement || replacement === original || replacement.includes('\n')) {
        return null;
    }

    if (replacement.length > Math.max(40, original.length * 3)) {
        return null;
    }

    return replacement;
}

function isSafeAutoCorrectMatch(match) {
    const category = match.rule?.category ?? '';
    const issueType = match.rule?.issueType ?? '';
    const original = match.original ?? '';

    if (!match.length || match.length > 60 || original.includes('\n')) {
        return false;
    }

    if (category === 'TYPOS' && original.length > 1 && original === original.toUpperCase()) {
        return false;
    }

    return SAFE_AUTO_CORRECT_CATEGORIES.has(category) || SAFE_AUTO_CORRECT_ISSUE_TYPES.has(issueType);
}

const PlateNoteEditor = forwardRef(function PlateNoteEditor(
    { value, readOnly = false, onOpenOcr, onContentChange, placeholder = 'Write your note here...' },
    ref,
) {
    const editorValue = useMemo(() => deserializeHtmlToValue(value ?? ''), [value]);
    const [formatStatus, setFormatStatus] = useState('');
    const [formatError, setFormatError] = useState('');
    const [autoCorrectStatus, setAutoCorrectStatus] = useState('');
    const [autoCorrectError, setAutoCorrectError] = useState('');
    const [autoCorrectProcessing, setAutoCorrectProcessing] = useState(false);
    const [dictationStatus, setDictationStatus] = useState('');
    const [dictationError, setDictationError] = useState('');
    const [isDictating, setIsDictating] = useState(false);
    const recognitionRef = useRef(null);
    const dictationSelectionRef = useRef(null);
    const dictationErroredRef = useRef(false);
    const editor = usePlateEditor(
        {
            plugins,
            value: editorValue,
        },
        [editorValue],
    );

    useEffect(() => {
        if (!editor) {
            return;
        }

        editor.tf.setValue(editorValue);
    }, [editor, editorValue]);

    useEffect(() => () => {
        recognitionRef.current?.stop?.();
        recognitionRef.current = null;
    }, []);

    const insertDictationText = (rawText) => {
        const text = rawText.trim();

        if (!text || !editor) {
            return;
        }

        if (dictationSelectionRef.current) {
            editor.tf.select(dictationSelectionRef.current);
        }

        const chunk = `${text} `;
        editor.tf.insertText(chunk);
        editor.tf.focus();
        dictationSelectionRef.current = cloneSelection(editor.selection);
    };

    const stopDictation = () => {
        recognitionRef.current?.stop?.();
    };

    const startDictation = () => {
        if (!editor) {
            return;
        }

        const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();

        if (!SpeechRecognitionConstructor) {
            setDictationError('Dictation is not supported in this browser. Use Chrome or Edge for English speech-to-text.');
            setDictationStatus('');
            return;
        }

        const recognition = new SpeechRecognitionConstructor();
        recognitionRef.current = recognition;
        dictationSelectionRef.current = cloneSelection(editor.selection);
        dictationErroredRef.current = false;
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsDictating(true);
            setDictationError('');
            setDictationStatus('Listening in English. Speak now, then click Dictation again to stop.');
        };

        recognition.onresult = (event) => {
            let transcript = '';

            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const result = event.results[index];

                if (result.isFinal) {
                    transcript += result[0]?.transcript ?? '';
                }
            }

            if (transcript) {
                insertDictationText(transcript);
                setDictationStatus('Inserted English dictation.');
            }
        };

        recognition.onerror = (event) => {
            dictationErroredRef.current = true;
            const messageMap = {
                'audio-capture': 'No microphone was found for dictation.',
                'not-allowed': 'Microphone permission was denied. Allow microphone access to use dictation.',
                'service-not-allowed': 'This browser blocked the speech recognition service.',
                'language-not-supported': 'English dictation is not supported by this browser.',
                network: 'Dictation could not reach the speech recognition service.',
                'no-speech': 'No speech was detected. Try speaking a little closer to the microphone.',
            };

            setDictationError(messageMap[event.error] ?? 'Dictation failed. Please try again.');
            setDictationStatus('');
        };

        recognition.onend = () => {
            setIsDictating(false);
            recognitionRef.current = null;

            if (!dictationErroredRef.current) {
                setDictationStatus((current) => current || 'Dictation stopped.');
            }
        };

        try {
            recognition.start();
        } catch (_error) {
            dictationErroredRef.current = true;
            recognitionRef.current = null;
            setIsDictating(false);
            setDictationError('Dictation could not start. Please try again.');
        }
    };

    const toggleDictation = () => {
        setDictationError('');

        if (isDictating) {
            stopDictation();
            return;
        }

        startDictation();
    };

    const applyAutoCorrect = async () => {
        if (!editor || readOnly || autoCorrectProcessing) {
            return;
        }

        const { text, map } = collectEditorTextMap(editor.children);

        setAutoCorrectError('');
        setAutoCorrectStatus('');

        if (!text.trim()) {
            setAutoCorrectStatus('Nothing to correct yet.');
            return;
        }

        setAutoCorrectProcessing(true);

        try {
            const response = await fetch(route('auto-correct.check'), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error('Auto correct is unavailable right now.');
            }

            const payload = await response.json();
            const candidates = (payload.matches ?? [])
                .map((match) => ({
                    ...match,
                    original: text.slice(match.offset, match.offset + match.length),
                }))
                .filter(isSafeAutoCorrectMatch)
                .map((match) => ({
                    ...match,
                    replacement: firstSafeReplacement(match),
                }))
                .filter((match) => match.replacement)
                .slice(0, 25)
                .sort((first, second) => second.offset - first.offset);

            if (!candidates.length) {
                setAutoCorrectStatus('No safe spelling or grammar fixes found.');
                return;
            }

            let applied = 0;
            let skipped = 0;

            candidates.forEach((match) => {
                const start = map[match.offset];
                const end = map[match.offset + match.length - 1];

                if (!start || !end || !samePath(start.path, end.path)) {
                    skipped += 1;
                    return;
                }

                editor.tf.select({
                    anchor: { path: start.path, offset: start.offset },
                    focus: { path: end.path, offset: end.offset + 1 },
                });
                editor.tf.insertText(match.replacement);
                applied += 1;
            });

            editor.tf.focus();
            onContentChange?.();

            setAutoCorrectStatus(
                applied
                    ? `Applied ${applied} safe correction${applied === 1 ? '' : 's'}${skipped ? `, skipped ${skipped} formatting-sensitive suggestion${skipped === 1 ? '' : 's'}` : ''}.`
                    : 'Suggestions were found, but none could be safely applied without changing formatting.',
            );
        } catch (error) {
            setAutoCorrectError(error.message || 'Auto correct failed. Please try again.');
        } finally {
            setAutoCorrectProcessing(false);
        }
    };

    const applyAutoFormat = () => {
        if (!editor) {
            return;
        }

        setFormatError('');
        setFormatStatus('');

        try {
            const blockEntry = getCurrentBlockEntry(editor);

            if (!blockEntry) {
                setFormatStatus('Place the cursor in a paragraph to auto format it.');
                return;
            }

            const [, path] = blockEntry;
            const blockRange = {
                anchor: editor.api.start(path),
                focus: editor.api.end(path),
            };
            const blockText = editor.api.string(blockRange);
            const trimmed = blockText.trim();

            if (!trimmed) {
                setFormatStatus('Nothing to auto format yet.');
                return;
            }

            const rules = [
                {
                    pattern: /^##\s+(.+)$/,
                    apply: (text) => {
                        editor.tf.select(blockRange);
                        editor.tf.insertText(text);
                        editor.tf.setNodes({ type: editor.getType('h3') }, { at: path });
                        setFormatStatus('Applied subheading formatting.');
                    },
                },
                {
                    pattern: /^#\s+(.+)$/,
                    apply: (text) => {
                        editor.tf.select(blockRange);
                        editor.tf.insertText(text);
                        editor.tf.setNodes({ type: editor.getType('h2') }, { at: path });
                        setFormatStatus('Applied heading formatting.');
                    },
                },
                {
                    pattern: /^[-*]\s+(.+)$/,
                    apply: (text) => {
                        editor.tf.select(blockRange);
                        editor.tf.insertText(text);
                        editor.getPlugin({ key: 'ul' })?.transforms?.ul?.toggle?.();
                        setFormatStatus('Applied bullet list formatting.');
                    },
                },
                {
                    pattern: /^\d+[.)]\s+(.+)$/,
                    apply: (text) => {
                        editor.tf.select(blockRange);
                        editor.tf.insertText(text);
                        editor.getPlugin({ key: 'ol' })?.transforms?.ol?.toggle?.();
                        setFormatStatus('Applied numbered list formatting.');
                    },
                },
            ];

            const matchedRule = rules.find((rule) => rule.pattern.test(trimmed));

            if (!matchedRule) {
                setFormatStatus('Start a paragraph with #, ##, -, *, or 1. then click Auto Format.');
                return;
            }

            const [, formattedText] = trimmed.match(matchedRule.pattern);
            matchedRule.apply(formattedText.trim());
            editor.tf.focus();
            onContentChange?.();
        } catch (_error) {
            setFormatError('Auto formatting failed. Please try again.');
        }
    };

    const applyAutoFormatMarker = (marker, range, path) => {
        editor.tf.select(range);
        editor.tf.delete();

        if (marker === '#') {
            editor.tf.setNodes({ type: editor.getType('h2') }, { at: path });
            setFormatStatus('Heading started.');
        } else if (marker === '##') {
            editor.tf.setNodes({ type: editor.getType('h3') }, { at: path });
            setFormatStatus('Subheading started.');
        } else if (marker === '-' || marker === '*') {
            editor.getPlugin({ key: 'ul' })?.transforms?.ul?.toggle?.();
            setFormatStatus('Bullet list started.');
        } else {
            editor.getPlugin({ key: 'ol' })?.transforms?.ol?.toggle?.();
            setFormatStatus('Numbered list started.');
        }

        editor.tf.focus();
        onContentChange?.();
    };

    const handleAutoFormatSpace = (event) => {
        if (readOnly || event.key !== ' ' || !isCollapsedSelection(editor.selection)) {
            return false;
        }

        const blockEntry = getCurrentBlockEntry(editor);

        if (!blockEntry) {
            return false;
        }

        const [, path] = blockEntry;
        const range = {
            anchor: editor.api.start(path),
            focus: editor.selection.anchor,
        };
        const marker = editor.api.string(range).trim();

        if (!['#', '##', '-', '*', '1.', '1)'].includes(marker)) {
            return false;
        }

        event.preventDefault();
        setFormatError('');
        setFormatStatus('');
        applyAutoFormatMarker(marker, range, path);

        return true;
    };

    useImperativeHandle(
        ref,
        () => ({
            async serialize() {
                if (!editor) {
                    return '<p></p>';
                }

                return serializeEditor(editor);
            },
            async appendText(text) {
                if (!editor) {
                    return;
                }

                const currentHtml = await serializeEditor(editor);
                const nextHtml = `${currentHtml}${normalizeEditorHtml(text)}`;

                editor.tf.setValue(deserializeHtmlToValue(nextHtml));
                editor.tf.focus();
            },
            autoFormat: applyAutoFormat,
            autoCorrect: applyAutoCorrect,
            toggleDictation,
            stopDictation,
        }),
        [editor, isDictating, autoCorrectProcessing],
    );

    if (!editor) {
        return null;
    }

    const handleEditorKeyDown = (event) => {
        if (handleAutoFormatSpace(event)) {
            return;
        }

        if (event.key !== 'Tab' || readOnly) {
            return;
        }

        const listTabHandled = editor.getPlugin({ key: 'listClassic' })?.transforms?.tab?.({
            reverse: event.shiftKey,
        });

        if (listTabHandled) {
            event.preventDefault();
            editor.tf.focus();
            return;
        }

        if (!event.shiftKey) {
            event.preventDefault();
            editor.tf.insertText('    ');
            editor.tf.focus();
        }
    };

    return (
        <div className={editorShellClassName}>
            <Plate
                editor={editor}
                readOnly={readOnly}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                onChange={() => onContentChange?.()}
            >
                {!readOnly ? (
                    <PlateToolbar
                        onOpenOcr={onOpenOcr}
                        onRequestDictation={toggleDictation}
                        onRequestAutoCorrect={applyAutoCorrect}
                        onFormatChange={onContentChange}
                        isDictating={isDictating}
                        autoCorrectProcessing={autoCorrectProcessing}
                    />
                ) : null}
                {dictationError ? (
                    <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                        {dictationError}
                    </p>
                ) : null}
                {!dictationError && dictationStatus ? (
                    <p className="mb-3 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">
                        {dictationStatus}
                    </p>
                ) : null}
                {autoCorrectError ? (
                    <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                        {autoCorrectError}
                    </p>
                ) : null}
                {!autoCorrectError && autoCorrectStatus ? (
                    <p className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                        {autoCorrectStatus}
                    </p>
                ) : null}
                {formatError ? (
                    <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                        {formatError}
                    </p>
                ) : null}
                {!formatError && formatStatus ? (
                    <p className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                        {formatStatus}
                    </p>
                ) : null}
                <PlateContent
                    readOnly={readOnly}
                    autoFocusOnEditable={!readOnly}
                    placeholder={placeholder}
                    className={editableClassName}
                    onKeyDown={handleEditorKeyDown}
                />
            </Plate>
        </div>
    );
});

export default PlateNoteEditor;
