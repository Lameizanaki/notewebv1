<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

class NoteContentSanitizer
{
    private const BLOCKED_TAGS = [
        'script',
        'style',
        'iframe',
        'object',
        'embed',
        'link',
        'meta',
    ];

    private const ALLOWED_TAGS = [
        'p' => 'p',
        'br' => 'br',
        'strong' => 'strong',
        'b' => 'strong',
        'em' => 'em',
        'i' => 'em',
        'u' => 'u',
        's' => 's',
        'strike' => 's',
        'ul' => 'ul',
        'ol' => 'ol',
        'li' => 'li',
        'blockquote' => 'blockquote',
        'h1' => 'h2',
        'h2' => 'h2',
        'h3' => 'h3',
        'h4' => 'h3',
        'div' => 'p',
    ];

    private const ALIGNABLE_TAGS = [
        'blockquote',
        'div',
        'h1',
        'h2',
        'h3',
        'h4',
        'li',
        'p',
    ];

    public static function sanitize(?string $content): ?string
    {
        $content = trim((string) $content);

        if ($content === '') {
            return null;
        }

        if (! self::looksLikeHtml($content)) {
            return self::plainTextToHtml($content);
        }

        $document = new DOMDocument('1.0', 'UTF-8');
        $wrapped = '<div id="note-root">'.$content.'</div>';

        libxml_use_internal_errors(true);
        $document->loadHTML(
            '<?xml encoding="utf-8" ?>'.$wrapped,
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );
        libxml_clear_errors();

        $root = $document->getElementById('note-root');

        if (! $root instanceof DOMElement) {
            return self::plainTextToHtml(strip_tags($content));
        }

        self::sanitizeChildren($root);

        $html = trim(self::innerHtml($root));

        return $html !== '' ? $html : null;
    }

    private static function sanitizeChildren(DOMNode $node): void
    {
        for ($child = $node->firstChild; $child !== null; $child = $next) {
            $next = $child->nextSibling;

            if ($child instanceof DOMElement) {
                self::sanitizeElement($child);
                continue;
            }

            if ($child->nodeType === XML_COMMENT_NODE) {
                $node->removeChild($child);
            }
        }
    }

    private static function sanitizeElement(DOMElement $element): void
    {
        $tagName = strtolower($element->tagName);
        $mappedTag = self::ALLOWED_TAGS[$tagName] ?? null;

        if ($mappedTag === null) {
            if (in_array($tagName, self::BLOCKED_TAGS, true)) {
                $element->parentNode?->removeChild($element);

                return;
            }

            self::unwrapElement($element);

            return;
        }

        $textAlign = in_array($tagName, self::ALIGNABLE_TAGS, true)
            ? self::safeTextAlign($element->getAttribute('style'))
            : null;
        $target = $mappedTag === $tagName ? $element : self::renameElement($element, $mappedTag);

        while ($target->attributes->length > 0) {
            $target->removeAttributeNode($target->attributes->item(0));
        }

        if ($textAlign !== null) {
            $target->setAttribute('style', 'text-align: '.$textAlign.';');
        }

        self::sanitizeChildren($target);

        if ($target->tagName !== 'br' && trim($target->textContent) === '' && ! $target->hasChildNodes()) {
            $target->parentNode?->removeChild($target);
        }
    }

    private static function safeTextAlign(string $style): ?string
    {
        if (preg_match('/(?:^|;)\s*text-align\s*:\s*(left|center|right)\s*(?:;|$)/i', $style, $matches) !== 1) {
            return null;
        }

        return strtolower($matches[1]);
    }

    private static function renameElement(DOMElement $element, string $newTag): DOMElement
    {
        $document = $element->ownerDocument;
        $replacement = $document->createElement($newTag);

        while ($element->firstChild !== null) {
            $replacement->appendChild($element->firstChild);
        }

        $element->parentNode?->replaceChild($replacement, $element);

        return $replacement;
    }

    private static function unwrapElement(DOMElement $element): void
    {
        $parent = $element->parentNode;

        if (! $parent) {
            return;
        }

        while ($element->firstChild !== null) {
            $parent->insertBefore($element->firstChild, $element);
        }

        $parent->removeChild($element);
    }

    private static function plainTextToHtml(string $content): string
    {
        $paragraphs = preg_split("/\r\n\r\n|\n\n|\r\r/", $content) ?: [];

        $html = array_map(function (string $paragraph): string {
            $escaped = htmlspecialchars(trim($paragraph), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

            return '<p>'.nl2br($escaped, false).'</p>';
        }, array_filter($paragraphs, fn (string $paragraph) => trim($paragraph) !== ''));

        return implode('', $html);
    }

    private static function looksLikeHtml(string $content): bool
    {
        return preg_match('/<\s*\/?\s*[a-z][^>]*>/i', $content) === 1;
    }

    private static function innerHtml(DOMElement $element): string
    {
        $html = '';

        foreach ($element->childNodes as $child) {
            $html .= $element->ownerDocument->saveHTML($child);
        }

        return $html;
    }
}
