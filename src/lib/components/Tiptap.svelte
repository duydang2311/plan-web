<script lang="ts">
    import { Editor, Extension } from '@tiptap/core';
    import Link from '@tiptap/extension-link';
    import Placeholder from '@tiptap/extension-placeholder';
    import Underline from '@tiptap/extension-underline';
    import StarterKit from '@tiptap/starter-kit';
    import clsx from 'clsx';
    import type { HTMLAttributes } from 'svelte/elements';
    import TiptapButton from './TiptapButton.svelte';
    import {
        IconBold,
        IconH1,
        IconH2,
        IconH3,
        IconH4,
        IconH5,
        IconH6,
        IconItalic,
        IconLink,
        IconQuotes,
        IconStrikeThrough,
        IconUnderline
    } from './icons';

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
                Underline,
                Link.configure({
                    protocols: ['http', 'https', 'mailto'],
                    defaultProtocol: 'https',
                    openOnClick: false,
                    autolink: true,
                    linkOnPaste: true,
                    isAllowedUri: (url, ctx) =>
                        ctx.defaultValidate(url) &&
                        ctx.protocols.some((a) =>
                            url.startsWith(typeof a === 'string' ? a : a.scheme)
                        ),
                    HTMLAttributes: {
                        class: 'c-link'
                    }
                }),
                Extension.create({
                    addKeyboardShortcuts() {
                        return {
                            Enter: () => {
                                this.editor.commands.setHardBreak();
                                return true;
                            },
                            'Shift-Enter': () => true,
                            'Mod-Enter': () => {
                                this.editor.emit('submit', undefined);
                                return true;
                            }
                        };
                    }
                })
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
    <div class="bg-base-1 border-b-base-border-3 overflow-hidden rounded-t-md border-b px-4 py-1">
        <ul class="flex items-center gap-1 text-sm">
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleBold().run()}
                    isActive={editor?.isActive('bold')}
                >
                    <IconBold />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleItalic().run()}
                    isActive={editor?.isActive('italic')}
                >
                    <IconItalic />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleUnderline().run()}
                    isActive={editor?.isActive('underline')}
                >
                    <IconUnderline />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleStrike().run()}
                    isActive={editor?.isActive('strike')}
                >
                    <IconStrikeThrough />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor?.isActive('heading', { level: 1 })}
                >
                    <IconH1 />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor?.isActive('heading', { level: 2 })}
                >
                    <IconH2 />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor?.isActive('heading', { level: 3 })}
                >
                    <IconH3 />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleHeading({ level: 4 }).run()}
                    isActive={editor?.isActive('heading', { level: 4 })}
                >
                    <IconH4 />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleHeading({ level: 5 }).run()}
                    isActive={editor?.isActive('heading', { level: 5 })}
                >
                    <IconH5 />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleHeading({ level: 6 }).run()}
                    isActive={editor?.isActive('heading', { level: 6 })}
                >
                    <IconH6 />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => editor!.chain().focus().toggleBlockquote().run()}
                    isActive={editor?.isActive('blockquote')}
                >
                    <IconQuotes />
                </TiptapButton>
            </li>
            <li>
                <TiptapButton
                    onclick={() => {
                        if (!editor) {
                            return;
                        }

                        const previousUrl = editor.getAttributes('link').href;
                        const url = window.prompt('URL', previousUrl);
                        if (url == null) {
                            return;
                        }

                        if (url.length === 0) {
                            editor.chain().focus().extendMarkRange('link').unsetLink().run();
                            return;
                        }

                        editor
                            .chain()
                            .focus()
                            .extendMarkRange('link')
                            .setLink({ href: url.includes(':') ? url : 'https://' + url })
                            .run();
                    }}
                    isActive={editor?.isActive('link')}
                >
                    <IconLink />
                </TiptapButton>
            </li>
        </ul>
    </div>

    <div class="transition-enforcement">
        <div
            use:tiptap
            class={clsx(
                'transition-opacity ease-out',
                status !== 'ready' ? 'opacity-0' : 'opacity-100'
            )}
        ></div>
        {#if status !== 'ready'}
            <div {...editorProps} class={editorProps?.class}></div>
        {/if}
    </div>
</div>
