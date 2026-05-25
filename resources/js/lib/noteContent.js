const blockTags = new Set(['P', 'H2', 'H3', 'UL', 'OL', 'LI', 'BLOCKQUOTE']);

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function plainTextToHtml(value = '') {
    const trimmed = value.trim();

    if (!trimmed) {
        return '';
    }

    return trimmed
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
        .join('');
}

function looksLikeHtml(value = '') {
    return /<\s*\/?\s*[a-z][^>]*>/i.test(value);
}

function unwrap(node) {
    const parent = node.parentNode;

    if (!parent) {
        return;
    }

    while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
    }

    parent.removeChild(node);
}

export function sanitizeEditorHtml(value = '') {
    const template = document.createElement('template');
    template.innerHTML = value;
    const blocked = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META']);

    const allowed = new Map([
        ['P', 'P'],
        ['BR', 'BR'],
        ['STRONG', 'STRONG'],
        ['B', 'STRONG'],
        ['EM', 'EM'],
        ['I', 'EM'],
        ['U', 'U'],
        ['S', 'S'],
        ['STRIKE', 'S'],
        ['UL', 'UL'],
        ['OL', 'OL'],
        ['LI', 'LI'],
        ['BLOCKQUOTE', 'BLOCKQUOTE'],
        ['H1', 'H2'],
        ['H2', 'H2'],
        ['H3', 'H3'],
        ['H4', 'H3'],
        ['DIV', 'P'],
    ]);

    const sanitizeNode = (node) => {
        const children = [...node.childNodes];

        children.forEach((child) => {
            if (child.nodeType === Node.COMMENT_NODE) {
                child.remove();
                return;
            }

            if (child.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            const tagName = child.tagName.toUpperCase();
            const mapped = allowed.get(tagName);

            if (!mapped) {
                if (blocked.has(tagName)) {
                    child.remove();
                    return;
                }

                unwrap(child);
                return;
            }

            let element = child;

            if (mapped !== tagName) {
                const replacement = document.createElement(mapped.toLowerCase());

                while (element.firstChild) {
                    replacement.appendChild(element.firstChild);
                }

                element.replaceWith(replacement);
                element = replacement;
            }

            [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
            sanitizeNode(element);
        });
    };

    sanitizeNode(template.content);

    const fragments = [];
    [...template.content.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();

            if (text) {
                fragments.push(`<p>${escapeHtml(text)}</p>`);
            }

            return;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            if (blockTags.has(node.tagName) || node.tagName === 'BR') {
                fragments.push(node.outerHTML);
            } else {
                fragments.push(`<p>${node.outerHTML}</p>`);
            }
        }
    });

    return fragments.join('').trim();
}

export function normalizeEditorHtml(value = '') {
    if (!value || !value.trim()) {
        return '';
    }

    return looksLikeHtml(value) ? sanitizeEditorHtml(value) : plainTextToHtml(value);
}

export function autoCorrectPlainText(value = '') {
    return value
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\bi\b/g, 'I')
        .replace(/([.!?])\s*([a-z])/g, (_, punctuation, letter) => `${punctuation} ${letter.toUpperCase()}`);
}

export function autoCorrectHtml(value = '') {
    const template = document.createElement('template');
    template.innerHTML = sanitizeEditorHtml(value);
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
    const textNodes = [];

    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
        node.textContent = autoCorrectPlainText(node.textContent);
    });

    return sanitizeEditorHtml(template.innerHTML);
}
