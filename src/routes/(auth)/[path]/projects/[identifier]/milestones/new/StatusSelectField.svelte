<script lang="ts">
    import { Button, Field, Label } from '~/lib/components';
    import { getMilestoneStatusIcon } from '~/lib/components/icons/utils';
    import Select from '~/lib/components/select';
    import { useRuntime } from '~/lib/contexts/runtime.client';
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
                {@const Icon = getMilestoneStatusIcon(status.icon)}
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
                        {@const Icon = getMilestoneStatusIcon(status.icon)}
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
