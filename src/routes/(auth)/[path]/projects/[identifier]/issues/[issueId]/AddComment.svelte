<script lang="ts">
    import { enhance } from '$app/forms';
    import { Editor } from '@tiptap/core';
    import { DateTime } from 'luxon';
    import { Button, TiptapEditor } from '~/lib/components';
    import { IconArrowUp } from '~/lib/components/icons';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { UserPreset } from '~/lib/models/user';
    import { type AsyncRef } from '~/lib/utils/runes.svelte';
    import type { ValidationResult } from '~/lib/utils/validation';
    import type { LocalIssueAudit } from './+page.server';
    import { clientValidate } from './utils.client';

    const {
        user,
        issueId,
        ref
    }: {
        user: UserPreset['basicProfile'];
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
                    user,
                    id: Math.random()
                } as LocalIssueAudit
            ],
            totalCount: (old?.totalCount ?? 0) + 1
        });

        e.formData.set('content', html);
        editor.commands.clearContent(true);
        return async ({ result }) => {
            if (result.type !== 'success') {
                editor?.commands.setContent(html);
                ref.value = old;
            }
        };
    }}
>
    <input type="hidden" name="issueId" value={issueId} />
    <div class="relative">
        <TiptapEditor
            bind:editor
            editorProps={{
                attributes: {
                    class: 'dark:bg-base-3 h-60 overflow-auto custom-scrollbar',
                    style: '--_border: var(--color-base-3)'
                }
            }}
            onCreate={({ editor }) => {
                handle({ editor });
                editor.on('submit', submit);
            }}
            onTransaction={({ editor }) => {
                handle({ editor });
            }}
            onDestroy={() => {
                if (!editor) {
                    return;
                }
                editor.off('submit', submit);
            }}
        />
        <Button
            variant="primary"
            size="sm"
            filled={false}
            class="absolute bottom-2 right-3 ml-auto flex w-fit items-center gap-2"
            disabled={validation && !validation.ok}
        >
            <IconArrowUp />
            Send
        </Button>
    </div>
</form>
