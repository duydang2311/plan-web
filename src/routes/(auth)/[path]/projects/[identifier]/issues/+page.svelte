<script lang="ts">
    import { page } from '$app/state';
    import { Button, Main, Tabs } from '~/lib/components';
    import { IconColumns, IconGanttChartOutline, IconPlus, IconRows } from '~/lib/components/icons';
    import { paginatedList } from '~/lib/models/paginatedList';
    import { permissions } from '~/lib/models/permission';
    import { createRef } from '~/lib/utils/runes.svelte';
    import { fluentSearchParams } from '~/lib/utils/url';
    import type { PageData } from './$types';
    import type { LocalIssue, LocalWorkspaceStatus } from './+page.server';
    import TableLayout from './TableLayout.svelte';
    import BoardLayout from './_board/BoardLayout.svelte';
    import { mapMaybePromise } from '~/lib/utils/promise';

    const { data }: { data: PageData } = $props();
    const createIssueHref = $derived(page.url.pathname + '/new');
    const tableIssueListRef = createRef.maybePromise(() =>
        data.page.tag === 'table' ? data.page.issueList : paginatedList<LocalIssue>()
    );
    const boardIssueListsRef = createRef.maybePromise(() =>
        data.page.tag === 'board' ? data.page.issueLists : {}
    );
    const boardStatusListRef = createRef.maybePromise(() => {
        if (data.page.tag === 'board') {
            const page = data.page;
            return mapMaybePromise(page.statusList)((a) =>
                a.failed ? Promise.resolve(paginatedList<LocalWorkspaceStatus>()) : a.data
            );
        }
        return null;
    });
    const tabsBuilder = new Tabs.Builder({
        value: () =>
            page.url.searchParams.get('view') === 'board'
                ? 'board'
                : page.url.searchParams.get('view') === 'timeline'
                  ? 'timeline'
                  : 'table'
    });
    const getProjectPermissionsRef = createRef.maybePromise(() => data.getProjectPermissions);
    const can = $derived({
        create: getProjectPermissionsRef.value?.has(permissions.createIssue) ?? false
    });
</script>

<Main>
    <div class="min-h-screen-sm grid h-full grid-rows-[auto_auto_1fr] gap-4">
        <div>
            <h1>Issues</h1>
            <p class="c-text-secondary text-pretty">
                Create, track, and resolve tasks—keep your project aligned, focused and fast-moving.
            </p>
        </div>
        <div class="flex justify-between gap-x-2 gap-y-2">
            <Tabs {...tabsBuilder.triggerList} class="*:px-4 sm:w-fit">
                <a
                    {...tabsBuilder.getTrigger('table')}
                    href="{page.url.pathname}{fluentSearchParams(page.url).delete('view')}"
                    class="c-tab--trigger flex items-center gap-2"
                    data-sveltekit-preload-data="hover"
                    data-sveltekit-replacestate
                >
                    <IconRows />
                    Table
                </a>
                <a
                    {...tabsBuilder.getTrigger('board')}
                    href="{page.url.pathname}{fluentSearchParams(page.url).set('view', 'board')}"
                    class="c-tab--trigger flex items-center gap-2"
                    data-sveltekit-preload-data="hover"
                    data-sveltekit-replacestate
                >
                    <IconColumns />
                    Board
                </a>
                <a
                    {...tabsBuilder.getTrigger('timeline')}
                    href="{page.url.pathname}{fluentSearchParams(page.url).set('view', 'timeline')}"
                    class="c-tab--trigger flex items-center gap-2"
                    data-sveltekit-preload-data="hover"
                    data-sveltekit-replacestate
                >
                    <IconGanttChartOutline />
                    Timeline
                </a>
            </Tabs>
            {#if can.create}
                <Button
                    as="link"
                    href={createIssueHref}
                    variant="primary"
                    class="flex w-fit items-center gap-2 capitalize max-sm:justify-center"
                >
                    <IconPlus />
                    Create issue
                </Button>
            {/if}
        </div>
        <div class="-mx-4 overflow-hidden">
            {#if data.page.tag === 'board'}
                <div class="h-full">
                    <BoardLayout
                        statusListRef={boardStatusListRef}
                        issueListsRef={boardIssueListsRef}
                        projectId={data.project.id}
                        projectIdentifier={data.project.identifier}
                    />
                </div>
            {:else if data.page.tag === 'timeline'}
                <div class="h-full">Gantt Chart</div>
            {:else}
                <div class="h-full px-4">
                    <TableLayout issueListRef={tableIssueListRef} />
                </div>
            {/if}
        </div>
    </div>
</Main>
