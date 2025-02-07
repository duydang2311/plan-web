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
        layouts,
        selected
    }: {
        layouts: (SelectOption<string> & {
            icon: IconName;
            href: string;
        })[];
        selected: Writable<SelectOption<string>>;
    } = $props();
    const open = writable(false);
    const selectedLayoutIcon = $derived<'rows' | 'columns'>(
        $selected.value === 'table' ? 'rows' : 'columns'
    );
</script>

<SelectBuilder
    options={{
        open,
        selected,
        positioning: {
            fitViewport: true,
            sameWidth: false,
            placement: 'bottom-start'
        },
        forceVisible: true,
        onSelectedChange: ({ next }) => {
            replaceState(
                layouts.find((a) => a.value === next?.value)?.href ??
                    `${page.url.pathname}${fluentSearchParams(page.url).delete('layout').toString()}`,
                page.state
            );
            return next;
        }
    }}
>
    {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
        <Button
            type="button"
            variant="base"
            filled={false}
            size="sm"
            flat
            class="relative h-full flex items-center gap-2 pl-6"
            melt={trigger}
        >
            <Icon name={selectedLayoutIcon} />
            {$selected.label}
            <Icon
                name="chevron-up-down"
                class="absolute right-0 -translate-x-1/2 top-1/2 -translate-y-1/2"
            />
        </Button>
        {#if $open}
            <ol
                use:melt={menu}
                class="c-select--menu space-y-1"
                in:tsap={select.in}
                out:tsap={select.out}
            >
                {#each layouts as layout (layout.value)}
                    {@const opt = option(layout)}
                    {@const selected = isSelected(layout.value)}
                    <li use:melt={opt} class="c-select--option">
                        {#if selected}
                            <Icon name="check" class="c-select--check" />
                        {/if}
                        <Icon name={layout.icon} />
                        {layout.label}
                    </li>
                {/each}
            </ol>
        {/if}
    {/snippet}
</SelectBuilder>
