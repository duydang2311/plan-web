<script lang="ts">
    import { page } from '$app/state';
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import { untrack } from 'svelte';
    import { writable } from 'svelte/store';
    import { Button, SelectBuilder } from '~/lib/components';
    import { IconCheck, IconChevronUpDown } from '~/lib/components/icons';
    import { select, tsap } from '~/lib/utils/transition';

    const {
        views
    }: {
        views: (SelectOption<string> & { href: string; icon: SvelteIconComponent })[];
    } = $props();
    const open = writable(false);
    const selected = writable<SelectOption<string>>(
        untrack(() => views.find((a) => a.value === page.url.searchParams.get('view')) ?? views[0])
    );
    const view = $derived($selected ? views.find((a) => a.value === $selected.value) : undefined);
</script>

<SelectBuilder
    options={{
        open,
        selected,
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
                    <li>
                        <a
                            href={v.href}
                            class="c-select--option"
                            use:melt={opt}
                            data-sveltekit-replacestate
                        >
                            {#if selected}
                                <IconCheck class="c-select--check" />
                            {/if}
                            <v.icon />
                            {v.label}
                        </a>
                    </li>
                {/each}
            </ol>
        {/if}
    {/snippet}
</SelectBuilder>
