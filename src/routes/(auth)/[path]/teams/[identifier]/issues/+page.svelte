<script lang="ts">
    import { page } from '$app/stores';
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import clsx from 'clsx';
    import { untrack } from 'svelte';
    import { writable } from 'svelte/store';
    import Button from '~/lib/components/Button.svelte';
    import Icon from '~/lib/components/Icon.svelte';
    import Select, { createSelectProps } from '~/lib/components/Select.svelte';
    import { fluentSearchParams } from '~/lib/utils/url';
    import type { PageData } from './$types';
    import BoardLayout from './_board/BoardLayout.svelte';
    import TableLayout from './TableLayout.svelte';

    const { data }: { data: PageData } = $props();
    const layouts = $derived([
        {
            label: 'Table',
            value: 'table',
            icon: 'rows' as const,
            href: fluentSearchParams($page.url).delete('layout').toString()
        },
        {
            label: 'Board',
            value: 'board',
            icon: 'columns' as const,
            href: fluentSearchParams($page.url).set('layout', 'board').toString()
        }
    ]);
    let layoutOpen = $state(false);
    let selectedLayout = writable<SelectOption<string>>(
        untrack(() => {
            return $page.url.searchParams.get('layout') === 'board' ? layouts[1] : layouts[0];
        })
    );
    let selectedLayoutIcon = $derived<'rows' | 'columns'>(
        $selectedLayout.value === 'table' ? 'rows' : 'columns'
    );
</script>

<main class="divide-y divide-base-border h-full flex flex-col">
    <div class="flex gap-4 justify-between items-center px-8 py-2">
        <p>Filter</p>
        <div class="flex gap-4 items-center">
            <Select
                bind:open={layoutOpen}
                options={createSelectProps<string, false>({
                    selected: selectedLayout,
                    positioning: {
                        fitViewport: true,
                        sameWidth: false,
                        placement: 'bottom-end'
                    }
                })}
            >
                {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
                    <Button
                        type="button"
                        variant="base"
                        outline
                        size="sm"
                        class="relative w-fit flex items-center gap-2 pr-10"
                        melt={trigger}
                    >
                        <Icon name={selectedLayoutIcon} />
                        {$selectedLayout.label}
                        <Icon
                            name="chevron-up-down"
                            class="absolute right-0 -translate-x-1/2 top-1/2 -translate-y-1/2"
                        />
                    </Button>
                    {#if layoutOpen}
                        <ol
                            use:melt={menu}
                            class="p-1 bg-base-1 border border-base-border rounded shadow-sm space-y-1 min-w-40"
                        >
                            {#each layouts as layout (layout.value)}
                                {@const opt = option(layout)}
                                {@const selected = isSelected(layout.value)}
                                <li use:melt={opt}>
                                    <a
                                        href={layout.href}
                                        class={clsx(
                                            'relative pl-10 pr-2 py-2 rounded-md w-full flex items-center gap-2',
                                            selected
                                                ? 'bg-base-2 text-base-fg-1 font-medium'
                                                : 'text-base-fg-3 hover:text-base-fg-1 hover:bg-base-2 data-[highlighted]:bg-base-2 data-[highlighted]:text-base-fg-1'
                                        )}
                                        data-sveltekit-preload-data="tap"
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
            <Button
                as="link"
                href="/{$page.params['path']}/teams/{$page.params['identifier']}/issues/new"
                variant="base"
                outline
                size="sm"
                class="w-fit flex items-center gap-2"
            >
                <Icon name="plus" />
                Add issue
            </Button>
        </div>
    </div>
    {#if $selectedLayout.value === 'table'}
        <TableLayout {data} />
    {:else}
        <BoardLayout {data} />
    {/if}
</main>
