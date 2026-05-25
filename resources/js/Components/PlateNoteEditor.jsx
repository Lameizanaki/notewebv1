import { normalizeEditorHtml } from '@/lib/noteContent';
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
    useEditorRef,
    useEditorSelector,
    usePlateEditor,
} from 'platejs/react';
import { serializeHtml } from 'platejs/static';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

const plugins = [BasicBlocksPlugin, BasicMarksPlugin, ListClassicPlugin];

const editorShellClassName =
    'min-h-[34rem] rounded-[2rem] border border-slate-800/90 bg-slate-950/70 p-4 shadow-[0_28px_80px_rgba(2,6,23,0.45)]';

const editableClassName =
    'min-h-[26rem] rounded-[1.5rem] px-4 py-4 text-[15px] leading-8 text-slate-100 outline-none [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-300/60 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-slate-300 [&_h1]:mt-7 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:tracking-[-0.03em] [&_h1]:text-white [&_h2]:mt-7 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-[-0.02em] [&_h3]:text-white [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:pl-1 [&_li]:text-slate-100 [&_ul_ol]:mt-2 [&_ul_ul]:mt-2';

function renderElement(props) {
    const { element } = props;

    switch (element.type) {
        case 'h1':
            return (
                <PlateElement
                    {...props}
                    as="h1"
                    className="mt-7 text-4xl font-semibold tracking-[-0.03em] text-white first:mt-0"
                />
            );
        case 'h2':
            return (
                <PlateElement
                    {...props}
                    as="h2"
                    className="mt-7 text-3xl font-semibold tracking-[-0.02em] text-white first:mt-0"
                />
            );
        case 'h3':
            return (
                <PlateElement
                    {...props}
                    as="h3"
                    className="mt-6 text-xl font-semibold tracking-[-0.02em] text-white first:mt-0"
                />
            );
        case 'blockquote':
            return (
                <PlateElement
                    {...props}
                    as="blockquote"
                    className="my-5 border-l-4 border-emerald-300/60 pl-5 text-[15px] italic leading-8 text-slate-300"
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
            return <PlateElement {...props} as="li" className="pl-1 text-slate-100" />;
        case 'lic':
            return <PlateElement {...props} as="div" className="min-w-0" />;
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
                    className="my-4 text-[15px] leading-8 text-slate-100 first:mt-0 last:mb-0"
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

function ToolbarButton({ active = false, label, onTrigger, title, wide = false }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(event) => {
                event.preventDefault();
                onTrigger?.();
            }}
            className={`inline-flex items-center justify-center rounded-2xl border px-3 py-2 text-xs font-medium transition ${
                wide ? 'min-w-[5.5rem]' : 'min-w-10'
            } ${
                active
                    ? 'border-emerald-400/70 bg-emerald-400/12 text-emerald-100'
                    : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500 hover:text-white'
            }`}
        >
            {label}
        </button>
    );
}

function PlateToolbar({
    autoCorrectDisabled = false,
    isDictating = false,
    onAutoCorrect,
    onOpenOcr,
    onRequestDictation,
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

    const paragraphType = editor.getType(KEYS.p);
    const headingType = editor.getType('h2');
    const subheadingType = editor.getType('h3');
    const quoteType = editor.getType(KEYS.blockquote);
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

    return (
        <div className="sticky top-3 z-10 mb-5 flex flex-wrap gap-2 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/90 p-3 backdrop-blur">
            <ToolbarButton
                active={!!marks.bold}
                label="B"
                title="Bold"
                onTrigger={() => runToggle(KEYS.bold)}
            />
            <ToolbarButton
                active={!!marks.italic}
                label="I"
                title="Italic"
                onTrigger={() => runToggle(KEYS.italic)}
            />
            <ToolbarButton
                active={!!marks.underline}
                label="U"
                title="Underline"
                onTrigger={() => runToggle(KEYS.underline)}
            />
            <ToolbarButton
                active={!!marks.strikethrough}
                label="S"
                title="Strikethrough"
                onTrigger={() => runToggle(KEYS.strikethrough)}
            />
            <div className="mx-1 hidden h-10 w-px bg-slate-800 lg:block" />
            <ToolbarButton
                active={currentBlockType === headingType}
                label="Heading"
                title="Heading"
                wide
                onTrigger={() => runToggle('h2')}
            />
            <ToolbarButton
                active={currentBlockType === subheadingType}
                label="Subhead"
                title="Subheading"
                wide
                onTrigger={() => runToggle('h3')}
            />
            <ToolbarButton
                active={currentBlockType === quoteType}
                label="Quote"
                title="Quote"
                wide
                onTrigger={() => runToggle(KEYS.blockquote)}
            />
            <ToolbarButton
                active={currentBlockType === paragraphType}
                label="Text"
                title="Paragraph"
                wide
                onTrigger={resetToParagraph}
            />
            <ToolbarButton
                active={activeListType === bulletedListType}
                label="Bullets"
                title="Bulleted list"
                wide
                onTrigger={() => runToggle('ul')}
            />
            <ToolbarButton
                active={activeListType === numberedListType}
                label="Numbered"
                title="Numbered list"
                wide
                onTrigger={() => runToggle('ol')}
            />
            <button
                type="button"
                onClick={onOpenOcr}
                className="rounded-2xl border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
                OCR Upload
            </button>
            <button
                type="button"
                onMouseDown={(event) => {
                    event.preventDefault();
                    onRequestDictation?.();
                }}
                className={`rounded-2xl border px-3 py-2 text-xs transition ${
                    isDictating
                        ? 'border-rose-400/70 bg-rose-500/10 text-rose-100'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
            >
                {isDictating ? 'Stop Dictation' : 'Dictation'}
            </button>
            <button
                type="button"
                onClick={onAutoCorrect}
                disabled={autoCorrectDisabled}
                className="rounded-2xl border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
                {autoCorrectDisabled ? 'Correcting...' : 'Auto Correct'}
            </button>
        </div>
    );
}

async function serializeEditor(editor) {
    return serializeHtml(editor, {
        stripClassNames: true,
        stripDataAttributes: true,
    });
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

function isExpandedSelection(selection) {
    if (!selection) {
        return false;
    }

    return (
        selection.anchor.offset !== selection.focus.offset ||
        selection.anchor.path.length !== selection.focus.path.length ||
        selection.anchor.path.some((segment, index) => segment !== selection.focus.path[index])
    );
}

function getCurrentBlockRange(editor) {
    const blockEntry = editor.api.above({
        at: editor.selection ?? undefined,
        match: (node) => typeof node === 'object' && node !== null && editor.api.isBlock(node),
    });

    if (!blockEntry) {
        return null;
    }

    const [, path] = blockEntry;

    return {
        anchor: editor.api.start(path),
        focus: editor.api.end(path),
    };
}

function getSpeechRecognitionConstructor() {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

const PlateNoteEditor = forwardRef(function PlateNoteEditor(
    { value, readOnly = false, onOpenOcr, onContentChange, placeholder = 'Write your note here...' },
    ref,
) {
    const normalizedValue = useMemo(() => normalizeEditorHtml(value ?? '') || '<p></p>', [value]);
    const [autoCorrectStatus, setAutoCorrectStatus] = useState('');
    const [autoCorrectError, setAutoCorrectError] = useState('');
    const [isAutoCorrecting, setIsAutoCorrecting] = useState(false);
    const [dictationStatus, setDictationStatus] = useState('');
    const [dictationError, setDictationError] = useState('');
    const [isDictating, setIsDictating] = useState(false);
    const recognitionRef = useRef(null);
    const dictationSelectionRef = useRef(null);
    const dictationErroredRef = useRef(false);
    const editor = usePlateEditor(
        {
            plugins,
            value: normalizedValue,
        },
        [normalizedValue],
    );

    useEffect(() => {
        if (!editor) {
            return;
        }

        editor.tf.setValue(normalizedValue);
    }, [editor, normalizedValue]);

    useEffect(() => () => {
        recognitionRef.current?.stop?.();
        recognitionRef.current = null;
    }, []);

    const requestAutoCorrect = async (text) => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const response = await fetch(route('autocorrect.store'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                text,
            }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(payload.message || 'Auto Correct failed. Please try again.');
        }

        return payload;
    };

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

                editor.tf.setValue(nextHtml || '<p></p>');
                editor.tf.focus();
            },
            async autoCorrect() {
                if (!editor) {
                    return;
                }

                setAutoCorrectError('');
                setAutoCorrectStatus('');
                setIsAutoCorrecting(true);

                try {
                    const selection = cloneSelection(editor.selection);

                    if (isExpandedSelection(selection)) {
                        const selectedText = editor.api.string(selection);
                        const payload = await requestAutoCorrect(selectedText);

                        if (payload.text !== selectedText) {
                            editor.tf.select(selection);
                            editor.tf.insertText(payload.text);
                            setAutoCorrectStatus(
                                payload.fallback_used
                                    ? 'LanguageTool was unavailable. Local cleanup corrected the selected text.'
                                    : 'Corrected selected text.',
                            );
                        } else {
                            setAutoCorrectStatus(
                                payload.fallback_used
                                    ? 'LanguageTool was unavailable. Local cleanup did not change the selected text.'
                                    : 'Selected text did not need changes.',
                            );
                        }

                        editor.tf.focus();
                        return;
                    }

                    const blockRange = getCurrentBlockRange(editor);

                    if (!blockRange) {
                        setAutoCorrectStatus('Nothing to correct here yet.');
                        return;
                    }

                    const blockText = editor.api.string(blockRange);

                    if (!blockText.trim()) {
                        setAutoCorrectStatus('Nothing to correct here yet.');
                        return;
                    }

                    const payload = await requestAutoCorrect(blockText);

                    if (payload.text !== blockText) {
                        editor.tf.select(blockRange);
                        editor.tf.insertText(payload.text);
                        setAutoCorrectStatus(
                            payload.fallback_used
                                ? 'LanguageTool was unavailable. Local cleanup corrected the current paragraph.'
                                : 'Corrected the current paragraph.',
                        );
                    } else {
                        setAutoCorrectStatus(
                            payload.fallback_used
                                ? 'LanguageTool was unavailable. Local cleanup did not change the current paragraph.'
                                : 'Current paragraph did not need changes.',
                        );
                    }

                    editor.tf.focus();
                } catch (error) {
                    setAutoCorrectError(error.message || 'Auto Correct failed. Please try again.');
                } finally {
                    setIsAutoCorrecting(false);
                }
            },
            toggleDictation,
            stopDictation,
        }),
        [editor, isDictating],
    );

    if (!editor) {
        return null;
    }

    const handleEditorKeyDown = (event) => {
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
                        onAutoCorrect={() => ref?.current?.autoCorrect?.()}
                        autoCorrectDisabled={isAutoCorrecting}
                        isDictating={isDictating}
                    />
                ) : null}
                {dictationError ? (
                    <p className="mb-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                        {dictationError}
                    </p>
                ) : null}
                {!dictationError && dictationStatus ? (
                    <p className="mb-3 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">
                        {dictationStatus}
                    </p>
                ) : null}
                {autoCorrectError ? (
                    <p className="mb-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                        {autoCorrectError}
                    </p>
                ) : null}
                {!autoCorrectError && autoCorrectStatus ? (
                    <p className="mb-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                        {autoCorrectStatus}
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
