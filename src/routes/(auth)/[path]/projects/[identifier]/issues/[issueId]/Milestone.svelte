<script lang="ts">
    import { Button, Label, Field } from '~/lib/components';
    import Select from '~/lib/components/select';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { createMilestoneListQuery } from './utils.client';
    import twemoji from '@twemoji/api';
    import type { LocalMilestone } from './types';

    const {
        milestone,
        projectId,
        onChange
    }: {
        milestone: LocalMilestone | undefined;
        projectId: string;
        onChange: (milestone: LocalMilestone | undefined) => void;
    } = $props();
    const { api } = useRuntime();
    const select = new Select.Builder({
        multiple: true,
        forceVisible: true,
        value: () => milestone?.id,
        onValueChange: (a) => {
            for(const value of a.values()) {
                const milestone = $query.data?.items.find((m) => m.id === value);
                if (milestone) {
            onChange(milestone);
            return;
                }
            }
            onChange(undefined);
        },
    });
    const query = createMilestoneListQuery(api)(() => ({ projectId }));
</script>

<Field>
    <Label for={select.trigger.id}>Milestone</Label>
    <Button
        {...select.trigger}
        type="button"
        variant="base"
        class="flex items-center justify-between gap-4 px-2"
    >
        {#if milestone}
        <div class="flex items-center gap-2">
            <div class="size-5">
                {@html twemoji.parse(milestone.emoji)}
            </div>
            <span>{milestone.title}</span>
        </div>
        {:else}
        <span>Select a milestone</span>
        {/if}
        <Select.Icon />
    </Button>
</Field>
{#if select.open}
    <Select {...select.content}>
        {#if $query.isPending}
            <span class="c-text-secondary"> Loading milestones... </span>
        {:else if $query.error}
            <span class="c-text-secondary">
                Something went wrong while loading milestones: <strong
                    >{$query.error.message}</strong
                >.
            </span>
        {:else if $query.data == null || $query.data.items.length === 0}
            <span class="c-text-secondary">No milestones found.</span>
        {:else}
            <ul>
                {#each $query.data.items as milestone (milestone.id)}
                    <li>
                        <Select.Option {...select.getOption(milestone.id)}>
                            {#if select.isSelected(milestone.id)}
                                <Select.Check />
                            {/if}
                            <div class="size-5">
                                {@html twemoji.parse(milestone.emoji)}
                            </div>
                            {milestone.title}
                        </Select.Option>
                    </li>
                {/each}
            </ul>
        {/if}
    </Select>
{/if}
