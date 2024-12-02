<script lang="ts">
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import { writable, type Writable } from 'svelte/store';
    import { Button, Icon, Select } from '~/lib/components';
    import type { IconName } from '~/lib/components/Icon.svelte';
    import { createSelectProps } from '~/lib/components/Select.svelte';

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

<Select
    options={createSelectProps<string, false>({
        open,
        selected,
        positioning: {
            fitViewport: true,
            sameWidth: false,
            placement: 'bottom-start'
        }
    })}
>
    {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
        <Button
            type="button"
            variant="base"
            filled={false}
            class="relative h-full flex items-center pl-6 gap-2 text-sm rounded-none"
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
            <ol use:melt={menu} class="c-select--menu">
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
</Select>
