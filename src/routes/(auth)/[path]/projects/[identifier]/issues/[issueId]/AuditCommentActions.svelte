<script lang="ts">
    import { melt } from '@melt-ui/svelte';
    import { writable } from 'svelte/store';
    import { IconButton, PopoverBuilder } from '~/lib/components';
    import { IconOptionsOutline } from '~/lib/components/icons';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import type { LocalIssueAudit } from './+page.server';
    import AuditCommentActionsPopover from './AuditCommentActionsPopover.svelte';
    import { popover, tsap } from '~/lib/utils/transition';

    let {
        auditId,
        editing = $bindable(),
        ref
    }: {
        auditId: number;
        editing: boolean;
        ref: Ref<PaginatedList<LocalIssueAudit> | undefined>;
    } = $props();

    const open = writable(false);
</script>

<PopoverBuilder options={{ open, forceVisible: true }}>
    {#snippet children({ trigger, content })}
        <IconButton
            title="Manage comment"
            class="text-base-fg-4 hover:text-(--_text_hover) active:text-(--_text_active)"
            melt={trigger}
        >
            <IconOptionsOutline />
        </IconButton>
        {#if $open}
            <div
                class="c-popover p-1"
                use:melt={content}
                in:tsap={popover.in}
                out:tsap={popover.out}
            >
                <AuditCommentActionsPopover
                    {auditId}
                    {editing}
                    {ref}
                    onEdit={() => {
                        editing = true;
                        $open = false;
                    }}
                />
            </div>
        {/if}
    {/snippet}
</PopoverBuilder>
