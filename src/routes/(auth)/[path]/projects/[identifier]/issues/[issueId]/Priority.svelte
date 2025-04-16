<script lang="ts">
    import { type SelectOption } from '@melt-ui/svelte';
    import { A, D, pipe } from '@mobily/ts-belt';
    import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { Select } from 'melt/builders';
    import { writable } from 'svelte/store';
    import { addToast, Button } from '~/lib/components';
    import { IconCheck } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import {
        getPriorityLabel,
        IssuePriorities,
        priorityIcons,
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
    const IconPriority = $derived(priorityIcons[$selected.value]);
    let value = $state.raw<string>(
        (items.find((a) => a.value === priority)?.value ?? items[0].value) + ''
    );
    const builder = new Select({
        value: () => value,
        onValueChange: (next) => {
            if (next) {
                if (next !== value) {
                    $mutation.mutate({ priority: Number(next) as IssuePriority });
                }
                value = next;
            }
        }
    });
</script>

<Button type="button" variant="base" size="sm" class="flex items-center gap-2" {...builder.trigger}>
    <IconPriority />
    <span>
        {getPriorityLabel($selected.value)}
    </span>
</Button>
{#if builder.open}
    <ol class="c-select--menu" in:tsap={select.in} out:tsap={select.out} {...builder.content}>
        {#each items as item (item.value)}
            {@const IconPriority = priorityIcons[item.value]}
            <li class="c-select--option" {...builder.getOption(item.value + '')}>
                <IconPriority />
                {#if builder.isSelected(item.value + '')}
                    <IconCheck class="c-select--check" />
                {/if}
                {item.label}
            </li>
        {/each}
    </ol>
{/if}
