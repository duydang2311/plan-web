<script lang="ts">
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import { writable, type Writable } from 'svelte/store';
    import { Button, Icon, SelectBuilder } from '~/lib/components';
    import type { IconName } from '~/lib/components/Icon.svelte';
    import { createSelectProps } from '~/lib/components/SelectBuilder.svelte';
    import { select, tsap } from '~/lib/utils/transition';

    const {
        layouts,
        selected
    }: {
        layouts: {
            label: string;
            value: string;
            icon: IconName;
            href: string;
        }[];
        selected: Writable<SelectOption<string>>;
    } = $props();
    const open = writable(false);
    const selectedLayoutIcon = $derived<'rows' | 'columns'>(
        $selected.value === 'table' ? 'rows' : 'columns'
    );
</script>

<SelectBuilder
    options={createSelectProps<string, false>({
        open,
        selected,
        positioning: {
            fitViewport: true,
            sameWidth: false,
            placement: 'bottom-start'
        },
        forceVisible: true
    })}
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
            <ol use:melt={menu} class="c-select--menu" in:tsap={select.in} out:tsap={select.out}>
                {#each layouts as layout (layout.value)}
                    {@const opt = option(layout)}
                    {@const selected = isSelected(layout.value)}
                    <li>
                        <a
                            use:melt={opt}
                            href={layout.href}
                            class="c-select--option"
                            data-sveltekit-replacestate
                        >
                            {#if selected}
                                <Icon
                                    name="check"
                                    class="absolute left-0 translate-x-1/2 top-1/2 -translate-y-1/2 text-primary-1"
                                />
                            {/if}
                            <Icon name={layout.icon} />
                            {layout.label}
                        </a>
                    </li>
                {/each}
            </ol>
        {/if}
    {/snippet}
</SelectBuilder>
