<script lang="ts">
    import { Editor } from '@tiptap/core';
    import Placeholder from '@tiptap/extension-placeholder';
    import Underline from '@tiptap/extension-underline';
    import StarterKit from '@tiptap/starter-kit';
    import clsx from 'clsx';
    import type { HTMLAttributes } from 'svelte/elements';
    import Icon from './Icon.svelte';
    import TiptapButton from './TiptapButton.svelte';

    interface Props extends HTMLAttributes<HTMLDivElement> {
        editor?: Editor;
        name?: string;
        content?: string;
        placeholder?: string;
        editorProps?: HTMLAttributes<HTMLDivElement>;
    }

    let {
        editor = $bindable(),
        name,
        content,
        placeholder,
        editorProps,
        ...props
    }: Props = $props();
    let status = $state<'ready' | 'loading' | null>(null);

    function tiptap(node: HTMLDivElement) {
        status = 'loading';
        editor = new Editor({
            element: node,
            content,
            editorProps: {
                attributes: {
                    ...(editorProps as Record<string, string>),
                    class: clsx('prose c-tiptap--editor', editorProps?.class)
                }
            },
            extensions: [
                StarterKit,
                Placeholder.configure({
                    placeholder
                }),
                Underline
            ],
            onTransaction: ({ editor: e }) => {
                editor = undefined;
                editor = e;
            },
            onCreate: () => {
                status = 'ready';
            }
        });
        return {
            destroy() {
                editor!.destroy();
            }
        };
    }
</script>

<div {...props} class={clsx('c-tiptap', props?.class)}>
    <div class="bg-base-2 border-b border-b-base-border-2 px-4 py-1 rounded-t-md overflow-hidden">
        <ul class="flex items-center gap-1 text-sm">
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleBold().run()}
                    isActive={editor?.isActive('bold')}
                >
                    <Icon name="bold" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleItalic().run()}
                    isActive={editor?.isActive('italic')}
                >
                    <Icon name="italic" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleUnderline().run()}
                    isActive={editor?.isActive('underline')}
                >
                    <Icon name="underline" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleStrike().run()}
                    isActive={editor?.isActive('strike')}
                >
                    <Icon name="strike-through" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor?.isActive('heading', { level: 1 })}
                >
                    <Icon name="h1" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor?.isActive('heading', { level: 2 })}
                >
                    <Icon name="h2" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor?.isActive('heading', { level: 3 })}
                >
                    <Icon name="h3" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleHeading({ level: 4 }).run()}
                    isActive={editor?.isActive('heading', { level: 4 })}
                >
                    <Icon name="h4" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleHeading({ level: 5 }).run()}
                    isActive={editor?.isActive('heading', { level: 5 })}
                >
                    <Icon name="h5" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleHeading({ level: 6 }).run()}
                    isActive={editor?.isActive('heading', { level: 6 })}
                >
                    <Icon name="h6" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleBlockquote().run()}
                    isActive={editor?.isActive('blockquote')}
                >
                    <Icon name="quotes" />
                </TiptapButton>
            </li>
        </ul>
    </div>

    <div class="transition-enforcement">
        <div
            use:tiptap
            class={clsx(
                'transition-opacity duration-500 ease-in-out',
                status !== 'ready' ? 'opacity-0' : 'opacity-100'
            )}
        ></div>
        {#if status !== 'ready'}
            <div {...editorProps} class={editorProps?.class}></div>
        {/if}
    </div>
</div>
