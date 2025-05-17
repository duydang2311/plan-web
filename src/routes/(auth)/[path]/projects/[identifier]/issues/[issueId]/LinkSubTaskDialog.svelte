<script lang="ts">
    import type { SubmitFunction } from '@sveltejs/kit';
    import type { Writable } from 'svelte/store';
    import { DialogBuilder } from '~/lib/components';
    import { IconLink } from '~/lib/components/icons';
    import { dialog, dialogOverlay, tsap } from '~/lib/utils/transition';
    import LinkSubTaskForm from './LinkSubTaskForm.svelte';
    import type { LocalSearchIssue } from './types';

    const {
        projectId,
        issueId,
        open,
        onLinkSubmit
    }: {
        projectId: string;
        issueId: string;
        open: Writable<boolean>;
        onLinkSubmit: (
            issue: LocalSearchIssue,
            e: Parameters<SubmitFunction>[0]
        ) => ReturnType<SubmitFunction>;
    } = $props();
</script>

<DialogBuilder options={{ open, forceVisible: true }}>
    {#snippet children(builder)}
        <div
            {...builder.overlay}
            use:builder.overlay.action
            class="c-dialog--overlay"
            in:tsap={dialogOverlay.in()}
            out:tsap={dialogOverlay.out()}
        ></div>
        <div
            {...builder.content}
            use:builder.content.action
            class="c-dialog--wrapper"
            in:tsap={dialog.in()}
            out:tsap={dialog.out()}
        >
            <div class="c-dialog">
                <div class="flex items-center justify-between gap-4">
                    <h2 {...builder.title}>Link existing task</h2>
                    <IconLink class="text-base-fg-1 size-8" />
                </div>
                <p {...builder.description} class="c-text-secondary text-pretty">
                    Link existing tasks to show dependencies, group related work, and streamline
                    complex projects.
                </p>
                <div class="mt-4">
                    <LinkSubTaskForm {projectId} {issueId} {onLinkSubmit} />
                </div>
            </div>
        </div>
    {/snippet}
</DialogBuilder>
