<script lang="ts">
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import { A, D, pipe } from '@mobily/ts-belt';
    import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { writable } from 'svelte/store';
    import { addToast, Button, Icon, Select } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { IssuePriorities, type IssuePriority } from '~/lib/models/issue';
    import { select, tsap } from '~/lib/utils/transition';

    interface Props {
        issueId: string;
    }

    const { issueId }: Props = $props();
    const queryClient = useQueryClient();
    const items = pipe(
        IssuePriorities,
        D.values,
        A.map((a) => ({
            label: getPriorityLabel(a),
            value: a
        }))
    );
    const open = writable(false);
    const queryKey = ['priority', { issueId }];
    const query = createQuery<IssuePriority>({
        queryKey
    });
    const { httpClient } = useRuntime();
    const mutation = createMutation({
        mutationFn: ({ priority }: { priority: IssuePriority }) =>
            httpClient.patch(`/api/issues/${issueId}`, { body: { patch: { priority } } }),
        onMutate: async ({ priority }) => {
            await queryClient.cancelQueries({ queryKey });
            const oldPriority = queryClient.getQueryData<IssuePriority>(queryKey);
            queryClient.setQueryData<IssuePriority>(queryKey, priority);
            $selected = items.find((a) => a.value === priority)!;
            return { oldPriority };
        },
        onSettled: async (data, error, _, context) => {
            if (error || !data?.ok) {
                if (context) {
                    queryClient.setQueryData<IssuePriority>(queryKey, context.oldPriority);
                    $selected = items.find((a) => a.value === context.oldPriority)!;
                }
                addToast({
                    data: {
                        title: 'Failed to update priority',
                        description: `We could not update the priority of the issue (${error ? error : data!.status}).`
                    }
                });
            }
            await queryClient.invalidateQueries({ queryKey });
        }
    });
    const priority = $derived($query.data ?? 0);
    const selected = writable<SelectOption<IssuePriority>>(
        items.find((a) => a.value === priority) ?? items[0]
    );

    function getPriorityLabel(priority: IssuePriority) {
        switch (priority) {
            case IssuePriorities.none:
                return 'No priority';
            case IssuePriorities.low:
                return 'Low';
            case IssuePriorities.medium:
                return 'Medium';
            case IssuePriorities.high:
                return 'High';
            case IssuePriorities.urgent:
                return 'Urgent';
        }
    }

    function getPriorityIcon(priority: IssuePriority) {
        switch (priority) {
            case IssuePriorities.none:
                return 'priority-none';
            case IssuePriorities.low:
                return 'priority-low';
            case IssuePriorities.medium:
                return 'priority-medium';
            case IssuePriorities.high:
                return 'priority-high';
            case IssuePriorities.urgent:
                return 'priority-urgent';
        }
    }
</script>

<Select
    options={{
        open,
        selected,
        onSelectedChange: ({ curr, next }) => {
            if (next && next.value !== curr?.value) {
                $mutation.mutate({ priority: next.value });
            }
            return next;
        }
    }}
>
    {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
        <Button
            type="button"
            variant="base"
            outline
            class="flex gap-4 items-center data-[state=open]:bg-base-3"
            melt={trigger}
        >
            <Icon name={getPriorityIcon($selected.value)} />
            <span>
                {getPriorityLabel($selected.value)}
            </span>
        </Button>
        {#if $open}
            <ol use:melt={menu} class="c-select--menu" in:tsap={select.in} out:tsap={select.out}>
                {#each items as item (item.value)}
                    {@const opt = option(item)}
                    {@const selected = isSelected(item.value)}
                    <li use:melt={opt} class="c-select--option">
                        <Icon name={getPriorityIcon(item.value)} />
                        {#if selected}
                            <Icon name="check" class="absolute left-2" />
                        {/if}
                        {item.label}
                    </li>
                {/each}
            </ol>
        {/if}
    {/snippet}
</Select>
