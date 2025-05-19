<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import { A, D, pipe } from '@mobily/ts-belt';
    import { Button, Field, Label, toast } from '~/lib/components';
    import Select from '~/lib/components/select';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { errorCodes } from '~/lib/models/errors';
    import {
        getPriorityLabel,
        IssuePriorities,
        priorityIcons,
        type Issue,
        type IssuePriority
    } from '~/lib/models/issue';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import { attempt } from '~/lib/utils/try';

    interface Props {
        ref: Ref<Pick<Issue, 'priority'>>;
        issueId: string;
        canUpdate: boolean;
    }

    const { ref, issueId, canUpdate }: Props = $props();
    const items = pipe(
        IssuePriorities,
        D.values,
        A.map((a) => ({
            label: getPriorityLabel(a),
            value: a
        }))
    );
    const { api } = useRuntime();
    const patchPriority = async (priority: IssuePriority) => {
        const old = ref.value;
        if (old) {
            ref.value = {
                ...old,
                priority
            };
        }

        const patchAttempt = await attempt.promise(() =>
            api.patch(`issues/${issueId}`, { body: { patch: { priority } } })
        )(errorCodes.fromFetch);
        if (patchAttempt.failed || !patchAttempt.data.ok) {
            ref.value = old;
            toast({
                body: 'Something went wrong while updating the issue priority',
                footer: `Error code: ${patchAttempt.failed ? patchAttempt.error : patchAttempt.data.status}.`
            });
            return;
        }

        await invalidateAll();
    };
    const IconPriority = $derived(priorityIcons[ref.value?.priority ?? IssuePriorities.none]);
    const value = $state.raw<string>(
        (items.find((a) => a.value === ref.value?.priority)?.value ?? items[0].value) + ''
    );
    const builder = new Select.Builder({
        value: () => value,
        onValueChange: (next) => {
            if (next && Number(next) !== ref.value?.priority) {
                patchPriority(Number(next) as IssuePriority);
            }
        }
    });
</script>

<Field>
    <Label for={builder.trigger.id}>Priority</Label>
    <Button
        type="button"
        variant="base"
        class="flex items-center gap-2 px-2"
        filled={false}
        disabled={!canUpdate}
        {...builder.trigger}
    >
        <IconPriority />
        <span>
            {getPriorityLabel(ref.value?.priority ?? IssuePriorities.none)}
        </span>
    </Button>
</Field>
{#if builder.open}
    <Select {...builder.content}>
        {#each Object.values(IssuePriorities) as priority}
            {@const IconPriority = priorityIcons[priority]}
            <Select.Option {...builder.getOption(priority + '')}>
                <IconPriority />
                {#if builder.isSelected(priority + '')}
                    <Select.Check />
                {/if}
                {getPriorityLabel(priority)}
            </Select.Option>
        {/each}
    </Select>
{/if}
