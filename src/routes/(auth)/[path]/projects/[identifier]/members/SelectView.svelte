<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import { writable, type Writable } from 'svelte/store';
    import { Button, Icon, SelectBuilder } from '~/lib/components';
    import type { IconName } from '~/lib/components/Icon.svelte';
    import { select, tsap } from '~/lib/utils/transition';
    import { fluentSearchParams } from '~/lib/utils/url';

    const {
        views,
        selected
    }: {
        views: (SelectOption<string> & { href: string; icon: IconName })[];
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
            class="relative flex gap-2 items-center px-8 w-40 overflow-hidden whitespace-nowrap text-ellipsis h-full"
            melt={trigger}
            title="View: {view?.label ?? 'N/A'}"
        >
            {#if view}
                <Icon name={view.icon} class="text-p" />
            {/if}
            <span class="text-nowrap text-ellipsis overflow-hidden w-full">
                {$selected?.label ?? 'Select view'}
            </span>
            <Icon name="chevron-up-down" class="absolute right-2 top-1/2 -translate-y-1/2" />
        </Button>
        {#if $open}
            <ol
                use:melt={menu}
                class="c-select--menu space-y-1 min-w-max"
                in:tsap={select.in}
                out:tsap={select.out}
            >
                {#each views as v (v.value)}
                    {@const opt = option(v)}
                    {@const selected = isSelected(v.value)}
                    <li use:melt={opt} class="c-select--option">
                        {#if selected}
                            <Icon name="check" class="c-select--check" />
                        {/if}
                        <Icon name={v.icon} />
                        {v.label}
                    </li>
                {/each}
            </ol>
        {/if}
    {/snippet}
</SelectBuilder>
