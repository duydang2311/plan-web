<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { Editor } from '@tiptap/core';
    import { DateTime } from 'luxon';
    import { Button, Icon, Tiptap } from '~/lib/components';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { AsyncRef } from '~/lib/utils/runes.svelte';
    import type { ValidationResult } from '~/lib/utils/validation';
    import type { LocalIssueAudit } from './+page.server';
    import { clientValidate } from './utils.client';

    const {
        userId,
        issueId,
        ref
    }: {
        userId: string;
        issueId: string;
        ref: AsyncRef<PaginatedList<LocalIssueAudit> | undefined>;
    } = $props();
    let editor = $state.raw<Editor>();
    let validation = $state.raw<ValidationResult>();
    let formRef = $state.raw<HTMLFormElement>();

    const handle = ({ editor }: { editor: Editor }) => {
        validation = clientValidate({
            editor,
            issueId
        });
    };

    const submit = () => {
        formRef?.requestSubmit();
    };

    $effect(() => {
        if (!editor) return;

        editor.on('create', handle);
        editor.on('update', handle);
        editor.on('submit', submit);

        return () => {
            if (!editor) {
                return;
            }
            editor.off('create', handle);
            editor.off('update', handle);
            editor.off('submit', submit);
        };
    });
</script>

<form
    bind:this={formRef}
    method="post"
    action="?/comment"
    class="space-y-2"
    use:enhance={(e) => {
        if (!editor) {
            e.cancel();
            return;
        }
        const html = editor.getHTML();
        const old = ref.value;
        ref.value = paginatedList({
            items: [
                ...(old?.items ?? []),
                {
                    data: {
                        content: html
                    },
                    createdTime: DateTime.now().toISO(),
                    action: 4,
                    user: {
                        id: userId,
                        email: userId,
                        profile: {
                            displayName: 'You'
                        }
                    },
                    id: Math.random()
                } as LocalIssueAudit
            ]
        });

        e.formData.set('content', html);
        editor.commands.clearContent(true);
        return async ({ result }) => {
            if (result.type !== 'success') {
                editor?.commands.setContent(html);
                ref.value = old;
            }
            await invalidateAll();
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
            class="absolute bottom-2 right-3 ml-auto flex w-fit items-center gap-2"
            disabled={validation && !validation.ok}
        >
            <Icon name="arrow-up" />
            Send
        </Button>
    </div>
</form>
