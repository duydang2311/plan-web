<script lang="ts">
    import { enhance } from '$app/forms';
    import { useQueryClient, type InfiniteData } from '@tanstack/svelte-query';
    import { Editor } from '@tiptap/core';
    import { DateTime } from 'luxon';
    import { Button, Icon, Tiptap } from '~/lib/components';
    import type { IssueComment } from '~/lib/models/issue_comment';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { ValidationResult } from '~/lib/utils/validation';
    import { clientValidate } from './utils.client';

    const { userId, size, issueId }: { userId: string; issueId: string; size: number } = $props();
    const queryClient = useQueryClient();
    let editor = $state.raw<Editor>();
    let validation = $state<ValidationResult>();

    $effect(() => {
        if (!editor) return;

        function handle({ editor }: { editor: Editor }) {
            validation = clientValidate({
                editor,
                issueId
            });
        }

        editor.on('create', handle);
        editor.on('update', handle);

        return () => {
            editor!.off('create', handle);
            editor!.off('update', handle);
        };
    });
</script>

<form
    method="post"
    action="?/comment"
    class="space-y-2"
    use:enhance={(e) => {
        if (!editor) {
            e.cancel();
            return;
        }
        const html = editor.getHTML();
        const queryKey = ['comments', { issueId, size }];
        const oldData =
            queryClient.getQueryData<InfiniteData<PaginatedList<IssueComment>, number>>(queryKey);
        queryClient.setQueryData<
            InfiniteData<PaginatedList<IssueComment> & { nextOffset: number | null }, number>
        >(queryKey, (a) => {
            if (!a) return a;
            let data: typeof a = undefined!;
            const totalCount = (a.pages.find((a) => a != null)?.totalCount ?? 0) + 1;
            const lastPage = a.pages[a.pages.length - 1] ?? paginatedList<IssueComment>();
            const optimisticComment = {
                content: html,
                createdTime: DateTime.now().toISO(),
                updatedTime: DateTime.now().toISO(),
                authorId: userId,
                id: Math.random() + '',
                $optimistic: true
            };
            if (lastPage.items.length >= size) {
                const page = a.pageParams[a.pageParams.length - 1] + size;
                data = {
                    ...a,
                    pages: [
                        ...a.pages.map((a) => ({
                            ...a,
                            totalCount,
                            nextOffset: a.nextOffset ?? page
                        })),
                        {
                            items: [optimisticComment],
                            totalCount,
                            nextOffset: null
                        }
                    ],
                    pageParams: [...a.pageParams, page]
                };
            } else {
                const lastIndex = a.pages.length - 1;
                data = {
                    ...a,
                    pages: a.pages.map((a, i) =>
                        i === lastIndex
                            ? {
                                  items: [...(a?.items ?? []), optimisticComment],
                                  totalCount,
                                  nextOffset: a?.nextOffset ?? null
                              }
                            : { ...a, totalCount }
                    )
                };
            }
            return data;
        });
        e.formData.set('content', html);
        return async ({ result }) => {
            if (result.type !== 'success') {
                queryClient.setQueryData(queryKey, oldData);
            }
            await queryClient.invalidateQueries({ queryKey });
        };
    }}
>
    <input type="hidden" name="issueId" value={issueId} />
    <div class="relative">
        <Tiptap
            bind:editor
            placeholder="Write your comment..."
            editorProps={{
                class: 'bg-base-1 min-h-24 max-h-60'
            }}
        />
        <Button
            variant="primary"
            size="sm"
            filled={false}
            class="absolute bottom-2 right-3 ml-auto w-fit flex gap-2 items-center"
            disabled={validation && !validation.ok}
        >
            <Icon name="arrow-up" />
            Send
        </Button>
    </div>
</form>
