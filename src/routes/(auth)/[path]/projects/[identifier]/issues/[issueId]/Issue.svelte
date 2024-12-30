<script lang="ts">
    import { enhance } from '$app/forms';
    import { createQuery } from '@tanstack/svelte-query';
    import { Editor } from '@tiptap/core';
    import DOMPurify from 'isomorphic-dompurify';
    import { derived as derivedStore, toStore } from 'svelte/store';
    import { addToast, Icon } from '~/lib/components';
    import Button from '~/lib/components/Button.svelte';
    import Tiptap from '~/lib/components/Tiptap.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { ActionData } from './$types';
    import type { LocalIssue } from './+page.server';
    import { createFetchIssueQuery } from './utils';

    interface Props {
        form: ActionData;
        editing: boolean;
        issueId: string;
        onCancel: () => void;
        onSubmit: () => void;
    }

    const { editing, issueId, onCancel, onSubmit }: Props = $props();
    const { api, queryClient } = useRuntime();
    const queryKey = $derived(['issues', { issueId }]);
    const query = createQuery(
        derivedStore(
            toStore(() => queryKey),
            ($queryKey) => ({
                queryKey: $queryKey,
                queryFn: async () => {
                    const response = await api.get(`issues/${issueId}`, {
                        query: createFetchIssueQuery()
                    });
                    return await response.json<LocalIssue>();
                }
            })
        )
    );
    const issue = $derived($query.data);
    let editor = $state.raw<Editor>();
</script>

{#if issue}
    <div class="flex gap-4">
        <h1>
            {issue.title}
        </h1>
        <span class="text-base-fg-ghost font-light text-h1">
            #{issue.orderNumber}
        </span>
    </div>
    <div class="max-w-full mt-6 transition-enforcement">
        {#if editing}
            <div>
                <form
                    method="post"
                    action="?/edit-description"
                    class="relative"
                    use:enhance={(e) => {
                        if (!editor) {
                            e.cancel();
                            return;
                        }

                        const old = queryClient.getQueryData<LocalIssue>(queryKey);
                        const newer = {
                            ...old,
                            description: editor.getHTML()
                        };
                        queryClient.setQueryData(queryKey, newer);
                        e.formData.set('description', newer.description);
                        onSubmit();
                        return ({ result }) => {
                            if (result.type !== 'success') {
                                queryClient.setQueryData(queryKey, old);
                                addToast({
                                    data: {
                                        title: 'Failed to update description',
                                        description:
                                            'An unknown error happened while we were trying to update the description.'
                                    }
                                });
                            }
                        };
                    }}
                >
                    <input type="hidden" name="issueId" value={issue.id} />
                    <Tiptap
                        bind:editor
                        name="description"
                        content={issue.description}
                        editorProps={{ class: 'pb-8' }}
                    />
                    <div class="absolute right-2 bottom-2 flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="base"
                            onclick={onCancel}
                            class="flex gap-2 items-center"
                        >
                            <Icon name="x-mark" />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            variant="primary"
                            class="flex gap-2 items-center"
                        >
                            <Icon name="check" />
                            Save
                        </Button>
                    </div>
                </form>
            </div>
        {:else}
            <div class="prose max-w-paragraph-lg">
                {#if issue.description && issue.description !== '<p></p>'}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html DOMPurify.sanitize(issue.description, {
                        USE_PROFILES: { html: true }
                    })}
                {:else}
                    <small class="font-medium text-base-fg-ghost"><i>Not available.</i></small>
                {/if}
            </div>
        {/if}
    </div>
{/if}
