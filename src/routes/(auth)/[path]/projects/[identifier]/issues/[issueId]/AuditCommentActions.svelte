<script lang="ts">
    import { IconButton } from '~/lib/components';
    import { IconOptionsOutline } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import type { LocalIssueAudit } from './+page.server';
    import AuditCommentActionsPopover from './AuditCommentActionsPopover.svelte';

    let {
        auditId,
        editing = $bindable(),
        ref
    }: {
        auditId: number;
        editing: boolean;
        ref: Ref<PaginatedList<LocalIssueAudit> | undefined>;
    } = $props();

    const builder = new Popover.Builder({
        forceVisible: true
    });
</script>

<IconButton
    title="Manage comment"
    class="text-base-fg-4 hover:text-(--_text_hover) active:text-(--_text_active)"
    {...builder.trigger}
>
    <IconOptionsOutline />
</IconButton>
{#if builder.open}
    <Popover {...builder.content}>
        <AuditCommentActionsPopover
            {auditId}
            {editing}
            {ref}
            onEdit={() => {
                editing = true;
                builder.open = false;
            }}
        />
    </Popover>
{/if}
