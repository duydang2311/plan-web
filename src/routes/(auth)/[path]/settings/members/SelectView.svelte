<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import { melt } from '@melt-ui/svelte';
    import { writable, type Writable } from 'svelte/store';
    import { Button, SelectBuilder } from '~/lib/components';
    import { IconCheck, IconChevronUpDown } from '~/lib/components/icons';
    import { fluentSearchParams } from '~/lib/utils/url';

    interface Props {
        options: { label: string; value: string; icon: SvelteIconComponent; default?: boolean }[];
        selected: Writable<{
            label: string;
            value: string;
            icon: SvelteIconComponent;
            default?: boolean;
        }>;
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
            class="relative flex w-52 max-w-52 items-center gap-2 overflow-hidden px-8"
            melt={trigger}
            title="View: {$selected.label}"
        >
            {#if selectedOption}
                <selectedOption.icon />
            {/if}
            <span class="w-full overflow-hidden text-ellipsis text-nowrap">
                {$selected.label}
            </span>
            <IconChevronUpDown class="absolute right-2 top-1/2 -translate-y-1/2" />
        </Button>
        {#if $open}
            <div use:melt={menu} class="c-select--menu">
                <ol class="space-y-1">
                    {#each options as item (item.value)}
                        {@const opt = option(item)}
                        {@const selected = isSelected(item.value)}
                        <li use:melt={opt} class="c-select--option">
                            {#if selected}
                                <IconCheck class="c-select--check" />
                            {/if}
                            <item.icon />
                            {item.label}
                        </li>
                    {/each}
                </ol>
            </div>
        {/if}
    {/snippet}
</SelectBuilder>
