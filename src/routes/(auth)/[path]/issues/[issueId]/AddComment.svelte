<script lang="ts">
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    import { Editor } from '@tiptap/core';
    import { Button, Icon, Tiptap } from '~/lib/components';
    import type { ValidationResult } from '~/lib/utils/validation';
    import { clientValidate } from './utils.client';
    import { useQueryClient, type InfiniteData } from '@tanstack/svelte-query';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { IssueComment } from '~/lib/models/issue_comment';
    import { DateTime } from 'luxon';

    const { userId, size }: { userId: string; size: number } = $props();
    const queryClient = useQueryClient();
    let editor = $state<Editor>();
    let validation = $state<ValidationResult>();

    $effect(() => {
        if (!editor) return;

        function handle({ editor }: { editor: Editor }) {
            validation = clientValidate({
                editor,
                issueId: $page.params['issueId']
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
        const queryKey = ['comments', { issueId: $page.params['issueId'], size }];
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
        return async ({ result, update }) => {
            if (result.type !== 'success') {
                queryClient.setQueryData(queryKey, oldData);
            }
            await update({ invalidateAll: false, reset: true });
        };
    }}
>
    <input type="hidden" name="issueId" value={$page.params['issueId']} />
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
            class="absolute p-1 bottom-2 right-3 block ml-auto w-fit"
            filled={false}
            outline
            disabled={validation && !validation.ok}
        >
            <Icon name="arrow-up" />
        </Button>
    </div>
</form>
