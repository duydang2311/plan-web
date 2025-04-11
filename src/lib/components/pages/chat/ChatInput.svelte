<script lang="ts">
    import { enhance } from '$app/forms';
    import type { InfiniteData } from '@tanstack/svelte-query';
    import { Editor } from '@tiptap/core';
    import { DateTime } from 'luxon';
    import { onMount } from 'svelte';
    import invariant from 'tiny-invariant';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import type { UserPreset } from '~/lib/models/user';
    import { tryPromise } from '~/lib/utils/try';
    import { Button } from '../..';
    import { createEditor } from '../../editor/utils';
    import { IconSend } from '../../icons';
    import { infinitizeChatMessageData, sortChatMessages, type LocalChatMessage } from './utils';

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

        const optimisticId = crypto.randomUUID();
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
                                optimisticId,
                                sender: user,
                                createdTime: DateTime.now().toISO(),
                                content
                            },
                            ...a.pages.flatMap((b) => b.items)
                        ],
                        a.pages[0]?.totalCount ?? 0
                    );
                }
            );
        }
        const tryCreateMessage = await tryPromise(() =>
            api.post('chat-messages', {
                body: {
                    chatId,
                    content,
                    optimisticId
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
                        a.pages
                            .flatMap((b) => b.items)
                            .filter((b) => b.optimisticId !== optimisticId),
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
                                b.optimisticId === optimisticId
                                    ? {
                                          ...b,
                                          id: json.id,
                                          optimisticId: undefined
                                      }
                                    : b
                            )
                            .toSorted(sortChatMessages),
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

        const e = createEditor({
            element: tiptapContainerRef,
            editorProps: {
                attributes: {
                    class:
                        'focus:outline-none prose max-w-full p-4 pr-32 rounded-b-lg ' +
                        'border-base-border-3 bg-base-4 dark:bg-base-5 hover:border-base-border-2 relative max-h-96 overflow-auto rounded-lg border custom-scrollbar',
                    style: '--_border: var(--color-base-4);'
                }
            },
            onCreate: ({ editor }) => {
                editor.on('submit', submit);
            },
            onDestroy: () => {
                e.off('submit', submit);
            },
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

<div class="relative mb-2 px-2">
    <div bind:this={tiptapContainerRef}></div>
    {#if editor}
        <form
            method="post"
            action="/actions?/create_chat_message"
            use:enhance={async (e) => {
                e.cancel();
                await submit();
                return () => {};
            }}
        >
            <Button
                variant="primary"
                size="sm"
                filled={false}
                class="absolute bottom-1.5 right-4 flex w-fit items-center gap-2"
            >
                <IconSend />
                <span>Send</span>
            </Button>
        </form>
    {/if}
</div>
