<script lang="ts">
    import { Button } from '~/lib/components';
    import { getMilestoneStatusIcon } from '~/lib/components/icons/utils';
    import Select from '~/lib/components/select';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { getMilestoneStatusColor } from '~/lib/features/milestones/utils';
    import Statuses from './new/Statuses.svelte';
    import { createStatusListQuery } from './new/utils.client';
    import type { LocalMilestoneStatus } from './types';

    const {
        id,
        projectId,
        status,
        onChange
    }: {
        id: string;
        projectId: string;
        status: LocalMilestoneStatus | undefined;
        onChange: (id: string, status: LocalMilestoneStatus) => void;
    } = $props();
    const { api } = useRuntime();

    // TODO: make this function shared
    const query = createStatusListQuery(api)(projectId);
    const select = new Select.Builder({
        forceVisible: true,
        sameWidth: false,
        value: () => status?.id,
        onValueChange: (a) => {
            const status = $query.data?.items.find((s) => s.id === a);
            if (status) {
                onChange(id, status);
            }
        }
    });
    const color = $derived(status ? getMilestoneStatusColor(status) : undefined);
</script>

<Button
    {...{
        ...select.trigger,
        style: [
            select.trigger.style,
            color
                ? `--_fg: color-mix(in oklch, ${color} 90%, transparent); --_fg-hover: ${color}; --_bg: color-mix(in oklch, ${color} 5%, transparent); --_bg-hover: color-mix(in oklch, ${color} 20%, transparent); --_bg-active: color-mix(in oklch, ${color} 10%, transparent);`
                : undefined
        ]
            .filter((a) => a != null)
            .join(';')
    }}
    variant="base"
    size="sm"
    class="status-trigger w-fit rounded-full"
>
    {#if status}
        {@const Icon = getMilestoneStatusIcon(status.icon, status.category)}
        <div class="flex items-center gap-2">
            {#if Icon}
                <Icon />
            {/if}
            {status.value}
        </div>
    {:else}
        <span class="text-base-fg-4">No status</span>
    {/if}
</Button>
{#if select.open}
    <Select {...select.content}>
        <!-- TODO: make this component shared -->
        <Statuses {projectId}>
            {#snippet children(statusList)}
                <div class="grid grid-cols-[auto_1fr]">
                    {#each statusList.items as status (status.id)}
                        {@const Icon = getMilestoneStatusIcon(status.icon, status.category)}
                        <Select.Option
                            {...select.getOption(status.id)}
                            class="col-span-full grid grid-cols-subgrid gap-2"
                        >
                            {#if Icon}
                                <Icon />
                            {:else}
                                <span aria-hidden="true"></span>
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

<style>
    .status-trigger {
    }
</style>
