<script lang="ts">
    import { Editor } from '@tiptap/core';
    import Placeholder from '@tiptap/extension-placeholder';
    import Underline from '@tiptap/extension-underline';
    import StarterKit from '@tiptap/starter-kit';
    import clsx from 'clsx';
    import { onMount } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import Icon from './Icon.svelte';
    import TiptapButton from './TiptapButton.svelte';
    import { browser } from '$app/environment';

    interface Props extends HTMLAttributes<HTMLDivElement> {
        editor?: Editor;
        name?: string;
        content?: string;
        placeholder?: string;
        containerProps?: HTMLAttributes<HTMLDivElement>;
    }

    let {
        editor = $bindable(),
        name,
        content,
        placeholder,
        containerProps,
        ...props
    }: Props = $props();

    let element = $state<HTMLDivElement>();
    let editors = $state.frozen<[Editor]>();

    $effect(() => {
        editor = editors?.[0];
    });

    onMount(() => {
        editors = [
            new Editor({
                element,
                content,
                editorProps: {
                    attributes: {
                        class: clsx('c-tiptap--editor prose', props.class)
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
                }
            })
        ];

        return () => {
            editors![0].destroy();
        };
    });
</script>

{#if browser}
    <div {...containerProps} class={clsx('c-tiptap', containerProps?.class)}>
        <div class="bg-base-2 border-b border-b-base-border px-4 py-1 rounded-t-md overflow-hidden">
            <ul class="flex items-center min-h-12 gap-1 text-sm">
                {#if editors?.[0]}
                    <li>
                        <TiptapButton
                            onclick={() => editors![0].chain().focus().toggleBold().run()}
                            isActive={editors![0].isActive('bold')}
                        >
                            <Icon name="bold" />
                        </TiptapButton>
                    </li>
                    <li>
                        <TiptapButton
                            onclick={() => editors![0].chain().focus().toggleItalic().run()}
                            isActive={editors![0].isActive('italic')}
                        >
                            <Icon name="italic" />
                        </TiptapButton>
                    </li>
                    <li>
                        <TiptapButton
                            onclick={() => editors![0].chain().focus().toggleUnderline().run()}
                            isActive={editors![0].isActive('underline')}
                        >
                            <Icon name="underline" />
                        </TiptapButton>
                    </li>
                    <li>
                        <TiptapButton
                            onclick={() => editors![0].chain().focus().toggleStrike().run()}
                            isActive={editors![0].isActive('strike')}
                        >
                            <Icon name="strike-through" />
                        </TiptapButton>
                    </li>
                    <li>
                        <TiptapButton
                            onclick={() =>
                                editors![0].chain().focus().toggleHeading({ level: 1 }).run()}
                            isActive={editors![0].isActive('heading', { level: 1 })}
                        >
                            <Icon name="h1" />
                        </TiptapButton>
                    </li>
                    <li>
                        <TiptapButton
                            onclick={() =>
                                editors![0].chain().focus().toggleHeading({ level: 2 }).run()}
                            isActive={editors![0].isActive('heading', { level: 2 })}
                        >
                            <Icon name="h2" />
                        </TiptapButton>
                    </li>
                    <li>
                        <TiptapButton
                            onclick={() =>
                                editors![0].chain().focus().toggleHeading({ level: 3 }).run()}
                            isActive={editors![0].isActive('heading', { level: 3 })}
                        >
                            <Icon name="h3" />
                        </TiptapButton>
                    </li>
                    <li>
                        <TiptapButton
                            onclick={() =>
                                editors![0].chain().focus().toggleHeading({ level: 4 }).run()}
                            isActive={editors![0].isActive('heading', { level: 4 })}
                        >
                            <Icon name="h4" />
                        </TiptapButton>
                    </li>
                    <li>
                        <TiptapButton
                            onclick={() =>
                                editors![0].chain().focus().toggleHeading({ level: 5 }).run()}
                            isActive={editors![0].isActive('heading', { level: 5 })}
                        >
                            <Icon name="h5" />
                        </TiptapButton>
                    </li>
                    <li>
                        <TiptapButton
                            onclick={() =>
                                editors![0].chain().focus().toggleHeading({ level: 6 }).run()}
                            isActive={editors![0].isActive('heading', { level: 6 })}
                        >
                            <Icon name="h6" />
                        </TiptapButton>
                    </li>
                    <li>
                        <TiptapButton
                            onclick={() => editors![0].chain().focus().toggleBlockquote().run()}
                            isActive={editors![0].isActive('blockquote')}
                        >
                            <Icon name="quotes" />
                        </TiptapButton>
                    </li>
                {/if}
            </ul>
        </div>

        <div
            bind:this={element}
            {...props}
            class={clsx('c-tiptap--textarea', 'relative', props.class)}
        ></div>
    </div>
{:else}
    <textarea
        {name}
        class={clsx('c-tiptap--textarea w-full h-full c-tiptap', containerProps?.class)}
        >{content}
    </textarea>
{/if}
