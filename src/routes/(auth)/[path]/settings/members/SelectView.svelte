<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import { melt } from '@melt-ui/svelte';
    import { writable, type Writable } from 'svelte/store';
    import { Button, Icon, SelectBuilder } from '~/lib/components';
    import type { IconName } from '~/lib/components/Icon.svelte';
    import { fluentSearchParams } from '~/lib/utils/url';

    interface Props {
        options: { label: string; value: string; icon: IconName; default?: boolean }[];
        selected: Writable<{ label: string; value: string; icon: IconName; default?: boolean }>;
    }

    const { options, selected }: Props = $props();

    const open = writable(false);
    const selectedOption = $derived(options.find((a) => a.value === $selected.value));
</script>

<SelectBuilder
    options={{
        open,
        selected,
        forceVisible: true,
        positioning: {
            sameWidth: false
        },
        onSelectedChange: ({ next }) => {
            const option = options.find((a) => a.value === next?.value)!;
            const searchParams = fluentSearchParams(page.url);
            if (option == null || option.default) {
                searchParams.delete('view');
            } else {
                searchParams.set('view', option.value);
            }
            replaceState(`${page.url.pathname}${searchParams.toString()}`, {});
            return next;
        }
    }}
>
    {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
        <Button
            variant="base"
            flat
            size="sm"
            filled={false}
            class="relative px-8 w-52 max-w-52 overflow-hidden flex items-center gap-2"
            melt={trigger}
            title="View: {$selected.label}"
        >
            {#if selectedOption}
                <Icon name={selectedOption.icon} />
            {/if}
            <span class="text-nowrap text-ellipsis overflow-hidden w-full">
                {$selected.label}
            </span>
            <Icon name="chevron-up-down" class="absolute right-2 top-1/2 -translate-y-1/2" />
        </Button>
        {#if $open}
            <div use:melt={menu} class="c-select--menu">
                <ol class="space-y-1">
                    {#each options as item (item.value)}
                        {@const opt = option(item)}
                        {@const selected = isSelected(item.value)}
                        <li use:melt={opt} class="c-select--option">
                            {#if selected}
                                <Icon name="check" class="c-select--check" />
                            {/if}
                            <Icon name={item.icon} />
                            {item.label}
                        </li>
                    {/each}
                </ol>
            </div>
        {/if}
    {/snippet}
</SelectBuilder>
