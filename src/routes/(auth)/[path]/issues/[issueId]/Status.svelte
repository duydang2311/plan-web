<script lang="ts">
    import type { SelectOption } from '@melt-ui/svelte';
    import { writable } from 'svelte/store';
    import { Button, Icon } from '~/lib/components';
    import Select from '~/lib/components/Select.svelte';
    import type { WorkspaceStatus } from '~/lib/models/status';
    import StatusOptions from './StatusOptions.svelte';
    import { isIconName } from '~/lib/components/Icon.svelte';

    interface Props {
        workspaceId: string;
        status?: Pick<WorkspaceStatus, 'id' | 'value' | 'icon'>;
    }

    const { workspaceId, status }: Props = $props();
    const open = writable(false);
    const selected = writable<SelectOption<WorkspaceStatus>>();
</script>

<Select options={{ selected, open, positioning: { placement: 'bottom', sameWidth: true } }}>
    {#snippet children({ trigger, menu, option, helpers })}
        <Button type="button" variant="base" class="flex gap-4 items-center" melt={trigger}>
            {#if $selected}
                {#if $selected.value.icon && isIconName($selected.value.icon)}
                    <Icon name={$selected.value.icon} />
                {/if}
            {:else if status?.icon && isIconName(status?.icon)}
                <Icon name={status.icon} />
            {/if}
            <span>
                {#if $selected?.value == null}
                    {status?.value ?? 'No status'}
                {:else}
                    {$selected.label}
                {/if}
            </span>
        </Button>
        {#if open}
            <StatusOptions {selected} selectProps={{ menu, option, helpers }} {workspaceId} />
        {/if}
    {/snippet}
</Select>
