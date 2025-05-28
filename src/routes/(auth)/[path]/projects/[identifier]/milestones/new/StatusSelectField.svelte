<script lang="ts">
    import { Button, Field, Label } from '~/lib/components';
    import Select from '~/lib/components/select';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { milestoneStatusIcons } from '~/lib/models/milestone';
    import Statuses from './Statuses.svelte';
    import { createStatusListQuery } from './utils.client';

    const { projectId }: { projectId: string } = $props();
    let value = $state.raw<string>();
    const select = new Select.Builder({
        value: () => value,
        onValueChange: (a) => {
            value = a;
        }
    });
    const { api } = useRuntime();
    const query = createStatusListQuery(api)(projectId);

    const getStatusIcon = (icon: string | undefined) => {
        if (icon && icon in milestoneStatusIcons) {
            return milestoneStatusIcons[icon as keyof typeof milestoneStatusIcons];
        }
        return undefined;
    };
</script>

<Field>
    <input type="hidden" name="statusId" {value} />
    <Label for={select.trigger.id}>Status (optional)</Label>
    <Button
        {...select.trigger}
        type="button"
        variant="base"
        outline
        class="flex justify-between gap-2 px-2"
    >
        {#if value}
            {@const status = $query.data?.items.find((s) => s.id === value)}
            {#if status}
                {@const Icon = getStatusIcon(status.icon)}
                <div class="flex items-center gap-2">
                    {#if Icon}
                        <Icon />
                    {/if}
                    {status.value}
                </div>
            {/if}
        {:else}
            Select a status
        {/if}
        <Select.Icon />
    </Button>
</Field>
{#if select.open}
    <Select {...select.content}>
        <Statuses {projectId}>
            {#snippet children(statusList)}
                <div class="grid grid-cols-[auto_1fr]">
                    {#each statusList.items as status (status.id)}
                        {@const Icon = getStatusIcon(status.icon)}
                        <Select.Option
                            {...select.getOption(status.id)}
                            class="col-span-full grid grid-cols-subgrid gap-2"
                        >
                            {#if Icon}
                                <Icon />
                            {:else}
                                <span></span>
                            {/if}
                            {#if select.isSelected(status.id)}
                                <Select.Check />
                            {/if}
                            <span>{status.value}</span>
                        </Select.Option>
                    {/each}
                </div>
            {/snippet}
        </Statuses>
    </Select>
{/if}
