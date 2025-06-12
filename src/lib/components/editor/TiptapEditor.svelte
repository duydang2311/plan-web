<script lang="ts">
    import { Editor, type EditorEvents, type Extensions } from '@tiptap/core';
    import type { EditorProps } from '@tiptap/pm/view';
    import clsx from 'clsx';
    import { onMount } from 'svelte';
    import FormatButtonGroup from './FormatButtonGroup.svelte';
    import SelectHeading from './SelectHeading.svelte';
    import SelectTextAlign from './SelectTextAlign.svelte';
    import { createEditor } from './utils';
    import { noop } from '~/lib/utils';

    let {
        class: cls,
        editor = $bindable(),
        editorProps,
        content,
        extensions,
        onCreate,
        onTransaction,
        onDestroy,
        onBlur
    }: {
        class?: string;
        editor?: Editor;
        editorProps?: EditorProps;
        content?: string;
        extensions?: Extensions;
        onCreate?: (props: EditorEvents['create']) => void;
        onTransaction?: (props: EditorEvents['transaction']) => void;
        onDestroy?: (props: EditorEvents['destroy']) => void;
        onBlur?: (props: EditorEvents['blur']) => void;
    } = $props();
    let editorNode = $state.raw<HTMLElement>();
    const editorClass =
        'focus:outline-none prose max-w-full p-2 bg-base-1 dark:bg-base-3 rounded-b-lg';

    onMount(() => {
        // let attributes = editorProps?.attributes;
        // if (attributes && typeof attributes === 'function') {
        //     const f = attributes;
        //     attributes = (state) => {
        //         const v = f(state);
        //         return {
        //             ...v,
        //             class: clsx(editorClass, v.class)
        //         };
        //     };
        // } else if (attributes) {
        //     attributes = {
        //         ...attributes,
        //         class: clsx(editorClass, attributes.class)
        //     };
        // }

        // const e = createEditor((a) => ({
        //     content,
        //     editorProps: {
        //         ...editorProps,
        //         attributes
        //     },
        //     element: editorNode,
        //     extensions: [...(a.extensions ?? []), ...(extensions ?? [])],
        //     onCreate: onCreate ?? noop,
        //     onTransaction: (props) => {
        //         editor = undefined;
        //         editor = props.editor;
        //         onTransaction?.(props);
        //     },
        //     onDestroy: onDestroy ?? noop,
        //     onBlur: onBlur ?? noop
        // }));
        // editor = e;
        // return () => {
        //     e.destroy();
        // };
    });
</script>

<div class={['c-tiptap-editor', cls]}>
    {#if editor}
        <div class="border-base-border-3 flex gap-2 border-b p-2">
            {#if !editor.isActive('codeBlock')}
                <SelectHeading {editor} />
                <SelectTextAlign {editor} />
            {/if}
            <FormatButtonGroup {editor} />
        </div>
    {/if}

    <div
        bind:this={editorNode}
        {@attach (node) => {
            let attributes = editorProps?.attributes;
            if (attributes && typeof attributes === 'function') {
                const f = attributes;
                attributes = (state) => {
                    const v = f(state);
                    return {
                        ...v,
                        class: clsx(editorClass, v.class)
                    };
                };
            } else if (attributes) {
                attributes = {
                    ...attributes,
                    class: clsx(editorClass, attributes.class)
                };
            }

            const e = createEditor((a) => ({
                content,
                editorProps: {
                    ...editorProps,
                    attributes
                },
                element: node,
                extensions: [...(a.extensions ?? []), ...(extensions ?? [])],
                onCreate: onCreate ?? noop,
                onTransaction: (props) => {
                    editor = undefined;
                    editor = props.editor;
                    onTransaction?.(props);
                },
                onDestroy: onDestroy ?? noop,
                onBlur: onBlur ?? noop
            }));
            editor = e;
            return () => {
                e.destroy();
            }
        }}
    ></div>
</div>
