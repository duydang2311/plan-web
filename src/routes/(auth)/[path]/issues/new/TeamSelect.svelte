<script lang="ts">
    import { type SelectOption } from '@melt-ui/svelte';
    import { writable, type Writable } from 'svelte/store';
    import { Button, Icon, Label, Select } from '~/lib/components';
    import { createSelectProps } from '~/lib/components/Select.svelte';
    import TeamSelectMenu from './TeamSelectMenu.svelte';

    const {
        workspaceId,
        selected
    }: { workspaceId: string; selected: Writable<SelectOption<string>> } = $props();

    const open = writable(false);
</script>

<Select
    options={createSelectProps<string, false>({
        open,
        selected
    })}
>
    {#snippet children({ trigger, menu, option, helpers })}
        <Label for={trigger.id}>Team</Label>
        <Button
            type="button"
            variant="base"
            outline
            class="relative flex items-center gap-2 pr-10 w-48"
            melt={trigger}
            autofocus
        >
            {#if $selected}
                {$selected.label}
            {:else}
                <span class="text-base-fg-3"> Select a team </span>
            {/if}
            <Icon
                name="chevron-up-down"
                class="absolute right-0 -translate-x-1/2 top-1/2 -translate-y-1/2"
            />
        </Button>
        {#if $open}
            <TeamSelectMenu {workspaceId} select={{ menu, option, helpers }} />
        {/if}
    {/snippet}
</Select>
