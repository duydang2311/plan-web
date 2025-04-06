import { Editor, Extension, type EditorOptions } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import History from '@tiptap/extension-history';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Strike from '@tiptap/extension-strike';
import Text from '@tiptap/extension-text';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';

export const createEditor = (
    options?: Partial<EditorOptions> | ((options: Partial<EditorOptions>) => Partial<EditorOptions>)
) => {
    const defaultOptions = {
        extensions: [
            Document,
            Paragraph,
            Text,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify']
            }),
            Heading,
            Bold,
            Italic,
            Strike,
            HardBreak,
            Link,
            ListItem,
            OrderedList,
            Placeholder.configure({
                placeholder: 'Type something...'
            }),
            Underline,
            Code,
            CodeBlock,
            HorizontalRule,
            History,
            BulletList,
            Extension.create({
                addKeyboardShortcuts: () => {
                    return {
                        'Ctrl-Enter': ({ editor }) => {
                            editor.emit('submit', void 0);
                            return true;
                        }
                    };
                }
            })
        ],
        content: '',
        injectCSS: true
    };
    return new Editor(
        typeof options === 'function'
            ? options(defaultOptions)
            : Object.assign(defaultOptions, options)
    );
};
