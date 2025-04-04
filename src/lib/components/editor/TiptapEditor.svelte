<script lang="ts">
    import { Editor, Extension, type EditorEvents } from '@tiptap/core';
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
    import { onMount } from 'svelte';
    import SelectHeading from './SelectHeading.svelte';
    import SelectTextAlign from './SelectTextAlign.svelte';
    import type { EditorProps } from '@tiptap/pm/view';
    import clsx from 'clsx';
    import FormatButtonGroup from './FormatButtonGroup.svelte';

    let {
        editor = $bindable(),
        editorProps,
        onCreate,
        onTransaction,
        onDestroy
    }: {
        editor?: Editor;
        editorProps?: EditorProps;
        onCreate?: (props: EditorEvents['create']) => void;
        onTransaction?: (props: EditorEvents['transaction']) => void;
        onDestroy?: (props: EditorEvents['destroy']) => void;
    } = $props();
    let editorNode = $state.raw<HTMLElement>();
    const editorClass =
        'focus:outline-none prose max-w-full p-2 bg-base-1 dark:bg-base-3 rounded-b-lg';

    onMount(() => {
        let attributes = editorProps?.attributes;
        if (attributes && typeof attributes === 'function') {
            const f = attributes;
            attributes = (state) => {
                return {
                    ...f(state),
                    class: clsx(editorClass, f(state).class)
                };
            };
        } else if (attributes) {
            attributes = {
                ...attributes,
                class: clsx(editorClass, attributes.class)
            };
        }

        const e = new Editor({
            editorProps: {
                ...editorProps,
                attributes
            },
            element: editorNode,
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
            onCreate,
            onTransaction: (props) => {
                editor = undefined;
                editor = props.editor;
                onTransaction?.(props);
            },
            onDestroy,
            injectCSS: true
        });
        editor = e;
        return () => {
            e.destroy();
        };
    });
</script>

<div class="border-base-border-2 bg-base-2 dark:bg-base-3 rounded-lg border">
    {#if editor}
        <div class="border-base-border-3 flex gap-2 border-b p-2">
            {#if !editor.isActive('codeBlock')}
                <SelectHeading {editor} />
                <SelectTextAlign {editor} />
            {/if}
            <FormatButtonGroup {editor} />
        </div>
    {/if}

    <div bind:this={editorNode}></div>
</div>
