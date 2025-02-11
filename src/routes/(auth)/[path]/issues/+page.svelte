<script lang="ts">
    import { page } from '$app/state';
    import type { SelectOption } from '@melt-ui/svelte';
    import { untrack } from 'svelte';
    import { writable } from 'svelte/store';
    import { Button, Icon } from '~/lib/components';
    import Input from '~/lib/components/Input.svelte';
    import { fluentSearchParams, stringifyQuery } from '~/lib/utils/url';
    import type { PageData } from './$types';
    import TableLayout from './TableLayout.svelte';
    import ViewLayoutSelect from './ViewLayoutSelect.svelte';
    import BoardLayout from './_board/BoardLayout.svelte';

    const { data }: { data: PageData } = $props();
    const filterQueryParams = $derived({
        team: page.url.searchParams.get('team'),
        project: page.url.searchParams.get('project')
    });
    const createIssueHref = $derived(
        `/${page.params['path']}/issues/new${stringifyQuery(filterQueryParams, { includeQuestionMark: true })}`
    );
    const layouts = $derived([
        {
            label: 'Table',
            value: 'table',
            icon: 'rows' as const,
            href: fluentSearchParams(page.url).delete('layout').toString()
        },
        {
            label: 'Board',
            value: 'board',
            icon: 'columns' as const,
            href: fluentSearchParams(page.url).set('layout', 'board').toString()
        }
    ]);
    const selectedLayout = writable<SelectOption<string>>(
        untrack(() => layouts[data.tag === 'board' ? 1 : 0])
    );
</script>

<main class="grid grid-rows-[auto_1fr_auto] h-full overflow-auto">
    <div class="flex justify-between border-b border-b-base-border-2">
        <div class="flex items-stretch *:first:pl-0 divide-x divide-base-border-2 grow">
            {#if filterQueryParams.project != null}
                <div class="min-w-32">
                    <ViewLayoutSelect {layouts} selected={selectedLayout} />
                </div>
            {/if}
            <div class="grow">
                <div class="relative">
                    <Input
                        type="text"
                        placeholder="Type to search issue..."
                        class="pl-8 w-full h-full text-sm border-none rounded focus:shadow-none"
                    />
                    <Icon name="search" class="absolute left-2 top-1/2 -translate-y-1/2" />
                </div>
            </div>
        </div>
        <div class="border-l border-l-base-border-2 flex items-center">
            <Button
                as="link"
                href={createIssueHref}
                variant="base"
                filled={false}
                class="flex items-center gap-2 rounded-none w-fit h-full pr-6 text-sm whitespace-nowrap text-ellipsis overflow-hidden"
            >
                <Icon name="plus" />
                Create issue
            </Button>
        </div>
    </div>
    {#if $selectedLayout.value === 'table'}
        <TableLayout {data} />
    {:else if $selectedLayout.value === 'board'}
        <BoardLayout {data} />
    {/if}
</main>
