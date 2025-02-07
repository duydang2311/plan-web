<script lang="ts">
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import { A, D, pipe } from '@mobily/ts-belt';
    import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { writable } from 'svelte/store';
    import { addToast, Button, Icon, SelectBuilder } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import {
        getPriorityIcon,
        getPriorityLabel,
        IssuePriorities,
        type IssuePriority
    } from '~/lib/models/issue';
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
    const { api } = useRuntime();
    const mutation = createMutation({
        mutationFn: ({ priority }: { priority: IssuePriority }) =>
            api.patch(`issues/${issueId}`, { body: { patch: { priority } } }),
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
            await Promise.all([
                queryClient.invalidateQueries({ queryKey }),
                queryClient.invalidateQueries({
                    queryKey,
                    predicate: ({ queryKey, queryHash }) =>
                        queryKey[0] === 'issues' && queryHash.includes('Priority')
                })
            ]);
        }
    });
    const priority = $derived($query.data ?? 0);
    const selected = writable<SelectOption<IssuePriority>>(
        items.find((a) => a.value === priority) ?? items[0]
    );
</script>

<SelectBuilder
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
            size="sm"
            class="flex gap-2 items-center"
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
                            <Icon name="check" class="c-select--check" />
                        {/if}
                        {item.label}
                    </li>
                {/each}
            </ol>
        {/if}
    {/snippet}
</SelectBuilder>
