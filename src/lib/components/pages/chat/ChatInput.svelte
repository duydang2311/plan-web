<script lang="ts">
    import type { InfiniteData } from '@tanstack/svelte-query';
    import { Editor, Extension } from '@tiptap/core';
    import Placeholder from '@tiptap/extension-placeholder';
    import StarterKit from '@tiptap/starter-kit';
    import { DateTime } from 'luxon';
    import { onMount } from 'svelte';
    import invariant from 'tiny-invariant';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import type { UserPreset } from '~/lib/models/user';
    import { tryPromise } from '~/lib/utils/try';
    import { infinitizeChatMessageData, type LocalChatMessage } from './utils';

    const { user, chatId }: { user: UserPreset['basicProfile']; chatId: string } = $props();
    const { api, queryClient } = useRuntime();
    let editor = $state.raw<Editor>();
    let tiptapContainerRef = $state.raw<HTMLElement>();

    const submit = async () => {
        invariant(editor, 'editor must not be null');

        if (editor.isEmpty) {
            return;
        }

        const content = editor.getHTML().trim();
        editor.commands.clearContent();

        const optimisticId = Date.now();
        const data = queryClient.getQueryData<InfiniteData<PaginatedList<LocalChatMessage>>>([
            'chat-messages',
            { chatId }
        ]);
        if (data) {
            queryClient.setQueryData<InfiniteData<PaginatedList<LocalChatMessage>>>(
                ['chat-messages', { chatId }],
                (a) => {
                    if (!a) {
                        return a;
                    }

                    return infinitizeChatMessageData(
                        [
                            {
                                id: optimisticId,
                                sender: user,
                                createdTime: DateTime.now().toISO(),
                                content
                            },
                            ...a.pages.flatMap((b) => b.items)
                        ].toSorted((a, b) => b.id - a.id),
                        a.pages[0]?.totalCount ?? 0
                    );
                }
            );
        }
        const tryCreateMessage = await tryPromise(() =>
            api.post('chat-messages', {
                body: {
                    chatId,
                    content
                }
            })
        )();
        if (!tryCreateMessage.ok) {
            if (editor.isEmpty) {
                editor.commands.setContent(content);
            }
            queryClient.setQueryData<InfiniteData<PaginatedList<LocalChatMessage>>>(
                ['chat-messages', { chatId }],
                (a) => {
                    if (!a) {
                        return a;
                    }

                    return infinitizeChatMessageData(
                        a.pages.flatMap((b) => b.items).filter((b) => b.id !== optimisticId),
                        a.pages[0]?.totalCount ?? 0
                    );
                }
            );
        } else {
            const json = await tryCreateMessage.data.json<{ id: number }>();
            invariant(typeof json.id === 'number', 'json.id must be a number');
            queryClient.setQueryData<InfiniteData<PaginatedList<LocalChatMessage>>>(
                ['chat-messages', { chatId }],
                (a) => {
                    if (!a) {
                        return a;
                    }

                    return infinitizeChatMessageData(
                        a.pages
                            .flatMap((b) => b.items)
                            .map((b) =>
                                b.id === optimisticId
                                    ? {
                                          ...b,
                                          id: json.id
                                      }
                                    : b
                            )
                            .toSorted((a, b) => b.id - a.id),
                        a.pages[0]?.totalCount ?? 0
                    );
                }
            );
        }
    };

    onMount(() => {
        if (!tiptapContainerRef) {
            return;
        }
        const e = new Editor({
            element: tiptapContainerRef,
            content: '',
            editorProps: {
                attributes: {
                    class: 'focus:outline-none p-4'
                }
            },
            extensions: [
                StarterKit,
                Placeholder.configure({
                    placeholder: 'Send a message...'
                }),
                Extension.create({
                    addKeyboardShortcuts() {
                        return {
                            'Mod-Enter': () => {
                                this.editor.emit('submit', undefined);
                                return true;
                            }
                        };
                    },
                    onCreate() {
                        this.editor.on('submit', submit);
                    },
                    onDestroy() {
                        this.editor.off('submit', submit);
                    }
                })
            ],
            onTransaction: ({ editor: e }) => {
                editor = undefined;
                editor = e;
            }
        });

        editor = e;
        return () => {
            e.destroy();
        };
    });
</script>

<div
    bind:this={tiptapContainerRef}
    class="border-base-border-2 bg-base-1 dark:bg-base-4 hover:border-base-border-1 relative mx-2 mb-2 max-h-96 overflow-auto rounded-lg border"
></div>
