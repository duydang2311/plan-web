<script lang="ts">
    import { type SelectOption } from '@melt-ui/svelte';
    import { writable, type Writable } from 'svelte/store';
    import { Button, Label, SelectBuilder } from '~/lib/components';
    import { IconChevronUpDown } from '~/lib/components/icons';
    import { createSelectProps } from '~/lib/components/SelectBuilder.svelte';
    import ProjectSelectMenu from './ProjectSelectMenu.svelte';

    const {
        workspaceId,
        selected
    }: { workspaceId: string; selected: Writable<SelectOption<string>> } = $props();

    const open = writable(false);
</script>

<SelectBuilder
    options={createSelectProps<string, false>({
        open,
        selected,
        forceVisible: true
    })}
>
    {#snippet children({ trigger, menu, option, helpers })}
        <Label for={trigger.id}>Project</Label>
        <Button
            type="button"
            variant="base"
            class="relative flex items-center gap-2 pr-10 text-base"
            melt={trigger}
            autofocus
        >
            {#if $selected}
                <span class="overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                    {$selected.label}
                </span>
            {:else}
                <span class="overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                    Select a project
                </span>
            {/if}
            <IconChevronUpDown class="absolute right-0 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        </Button>
        {#if $open}
            <ProjectSelectMenu {workspaceId} select={{ menu, option, helpers }} />
        {/if}
    {/snippet}
</SelectBuilder>
