<script lang="ts">
    import type { InfiniteData } from '@tanstack/svelte-query';
    import { Editor, Extension } from '@tiptap/core';
    import Placeholder from '@tiptap/extension-placeholder';
    import StarterKit from '@tiptap/starter-kit';
    import { DateTime } from 'luxon';
    import { onMount } from 'svelte';
    import invariant from 'tiny-invariant';
    import type { LocalChatMessage } from '~/lib/components/pages/chat/ChatInbox.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import type { UserPreset } from '~/lib/models/user';
    import { tryPromise } from '~/lib/utils/try';

    const { user, chatId }: { user: UserPreset['basicProfile']; chatId: string } = $props();
    const { api, queryClient } = useRuntime();
    let editor = $state.raw<Editor>();
    let tiptapContainerRef = $state.raw<HTMLElement>();

    const submit = async () => {
        invariant(editor, 'editor must not be null');

        const content = editor.getHTML().trim();
        editor.commands.clearContent();
        if (content.length === 0) {
            return;
        }

        const optimisticId = -Date.now();
        const data = queryClient.getQueryData<InfiniteData<PaginatedList<LocalChatMessage>>>([
            'chat-messages',
            { chatId }
        ]);
        if (data) {
            queryClient.setQueryData(['chat-messages', { chatId }], {
                pages: [
                    {
                        items: [
                            {
                                id: optimisticId,
                                sender: user,
                                createdTime: DateTime.now().toISO(),
                                content
                            },
                            ...data.pages[0].items
                        ],
                        totalCount: data.pages[0].totalCount + 1
                    },
                    ...data.pages.slice(1)
                ],
                pageParams: data.pageParams
            });
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
            invariant(
                editor.storage.characterCount != null &&
                    typeof editor.storage.characterCount.characters === 'function',
                'editor.storage.characterCount.characters() must be a function'
            );
            if (editor.storage.characterCount.characters() === 0) {
                editor.commands.setContent(content);
            }
            queryClient.setQueryData<InfiniteData<PaginatedList<LocalChatMessage>>>(
                ['chat-messages', { chatId }],
                (a) =>
                    a
                        ? {
                              pages: a.pages.filter(
                                  (b) =>
                                      b.items.length !== 1 ||
                                      b.items.every((c) => c.id !== optimisticId)
                              ),
                              pageParams: a.pageParams.filter((b) => b !== optimisticId)
                          }
                        : undefined
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
