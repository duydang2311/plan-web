<script lang="ts">
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import { writable, type Writable } from 'svelte/store';
    import { Button, SelectBuilder } from '~/lib/components';
    import { IconCheck, IconChevronUpDown } from '~/lib/components/icons';
    import { select, tsap } from '~/lib/utils/transition';

    const {
        layouts,
        selected
    }: {
        layouts: (SelectOption<string> & {
            icon: SvelteIconComponent;
            href: string;
        })[];
        selected: Writable<SelectOption<string>>;
    } = $props();
    const open = writable(false);
    const selectedLayout = $derived(layouts.find((a) => a.value === $selected.value));
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
        forceVisible: true
    }}
>
    {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
        <Button
            type="button"
            variant="base"
            filled={false}
            size="sm"
            flat
            class="relative flex h-full items-center gap-2 pl-6"
            melt={trigger}
        >
            {#if selectedLayout}
                <selectedLayout.icon />
            {/if}
            {$selected.label}
            <IconChevronUpDown class="absolute right-0 top-1/2 -translate-x-1/2 -translate-y-1/2" />
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
                    <li>
                        <a
                            href={layout.href}
                            use:melt={opt}
                            class="c-select--option"
                            data-sveltekit-replacestate
                        >
                            {#if selected}
                                <IconCheck class="c-select--check" />
                            {/if}
                            <layout.icon />
                            {layout.label}
                        </a>
                    </li>
                {/each}
            </ol>
        {/if}
    {/snippet}
</SelectBuilder>
