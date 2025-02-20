<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import { writable, type Writable } from 'svelte/store';
    import { Button, SelectBuilder } from '~/lib/components';
    import { IconCheck, IconChevronUpDown } from '~/lib/components/icons';
    import { select, tsap } from '~/lib/utils/transition';
    import { fluentSearchParams } from '~/lib/utils/url';

    const {
        views,
        selected
    }: {
        views: (SelectOption<string> & { href: string; icon: SvelteIconComponent })[];
        selected: Writable<SelectOption<string>> | undefined;
    } = $props();
    const open = writable(false);
    const view = $derived($selected ? views.find((a) => a.value === $selected.value) : undefined);
</script>

<SelectBuilder
    options={{
        open,
        selected,
        onSelectedChange: ({ next }) => {
            replaceState(
                views.find((a) => a.value === next?.value)?.href ??
                    `${page.url.pathname}${fluentSearchParams(page.url).delete('view')}`,
                page.state
            );
            return next;
        },
        positioning: {
            placement: 'bottom-start',
            sameWidth: false
        }
    }}
>
    {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
        <Button
            type="button"
            variant="base"
            size="sm"
            flat
            filled={false}
            class="relative flex h-full w-40 items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap px-8"
            melt={trigger}
            title="View: {view?.label ?? 'N/A'}"
        >
            {#if view}
                <view.icon class="text-p" />
            {/if}
            <span class="w-full overflow-hidden text-ellipsis text-nowrap">
                {$selected?.label ?? 'Select view'}
            </span>
            <IconChevronUpDown class="absolute right-2 top-1/2 -translate-y-1/2" />
        </Button>
        {#if $open}
            <ol
                use:melt={menu}
                class="c-select--menu min-w-max space-y-1"
                in:tsap={select.in}
                out:tsap={select.out}
            >
                {#each views as v (v.value)}
                    {@const opt = option(v)}
                    {@const selected = isSelected(v.value)}
                    <li use:melt={opt} class="c-select--option">
                        {#if selected}
                            <IconCheck class="c-select--check" />
                        {/if}
                        <v.icon />
                        {v.label}
                    </li>
                {/each}
            </ol>
        {/if}
    {/snippet}
</SelectBuilder>
