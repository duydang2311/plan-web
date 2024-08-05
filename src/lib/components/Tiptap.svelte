<script lang="ts">
    import { Editor } from '@tiptap/core';
    import Placeholder from '@tiptap/extension-placeholder';
    import Underline from '@tiptap/extension-underline';
    import StarterKit from '@tiptap/starter-kit';
    import clsx from 'clsx';
    import { cubicInOut } from 'svelte/easing';
    import type { HTMLAttributes } from 'svelte/elements';
    import { fade } from 'svelte/transition';
    import Icon from './Icon.svelte';
    import Spinner from './Spinner.svelte';
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
    let editors = $state.frozen<[Editor]>();
    let status = $state<'ready' | 'loading' | null>(null);

    $effect(() => {
        editor = editors?.[0];
    });

    function tiptap(node: HTMLDivElement) {
        status = 'loading';
        editors = [
            new Editor({
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
                onTransaction: () => {
                    editors = [editors![0]];
                },
                onCreate: () => {
                    status = 'ready';
                }
            })
        ];
        return {
            destroy() {
                editors![0].destroy();
            }
        };
    }
</script>

<div {...props} class={clsx('c-tiptap', props?.class)}>
    <div class="bg-base-2 border-b border-b-base-border px-4 py-1 rounded-t-md overflow-hidden">
        <ul class="flex items-center gap-1 text-sm">
            <li>
                <TiptapButton
                    onclick={() => editors?.[0].chain().focus().toggleBold().run()}
                    isActive={editors?.[0].isActive('bold')}
                >
                    <Icon name="bold" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editors?.[0].chain().focus().toggleItalic().run()}
                    isActive={editors?.[0].isActive('italic')}
                >
                    <Icon name="italic" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editors?.[0].chain().focus().toggleUnderline().run()}
                    isActive={editors?.[0].isActive('underline')}
                >
                    <Icon name="underline" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editors?.[0].chain().focus().toggleStrike().run()}
                    isActive={editors?.[0].isActive('strike')}
                >
                    <Icon name="strike-through" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editors?.[0].chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editors?.[0].isActive('heading', { level: 1 })}
                >
                    <Icon name="h1" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editors?.[0].chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editors?.[0].isActive('heading', { level: 2 })}
                >
                    <Icon name="h2" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editors?.[0].chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editors?.[0].isActive('heading', { level: 3 })}
                >
                    <Icon name="h3" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editors?.[0].chain().focus().toggleHeading({ level: 4 }).run()}
                    isActive={editors?.[0].isActive('heading', { level: 4 })}
                >
                    <Icon name="h4" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editors?.[0].chain().focus().toggleHeading({ level: 5 }).run()}
                    isActive={editors?.[0].isActive('heading', { level: 5 })}
                >
                    <Icon name="h5" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editors?.[0].chain().focus().toggleHeading({ level: 6 }).run()}
                    isActive={editors?.[0].isActive('heading', { level: 6 })}
                >
                    <Icon name="h6" />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editors?.[0].chain().focus().toggleBlockquote().run()}
                    isActive={editors?.[0].isActive('blockquote')}
                >
                    <Icon name="quotes" />
                </TiptapButton>
            </li>
        </ul>
    </div>

    <div class="transition-enforcement">
        <div use:tiptap class={status === 'loading' ? 'hidden' : undefined}></div>
        {#if status !== 'ready'}
            <div
                {...editorProps}
                class={clsx('relative', editorProps?.class)}
                transition:fade={{ duration: 300, easing: cubicInOut }}
            >
                <Spinner
                    class="absolute text-primary-3 size-8 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                />
            </div>
        {/if}
    </div>
</div>
