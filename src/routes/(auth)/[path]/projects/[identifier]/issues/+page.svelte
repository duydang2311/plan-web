<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { makeControlledDebounce } from '@mobily/ts-belt/Function';
    import { Button, Input, Main, Tabs } from '~/lib/components';
    import {
        IconColumns,
        IconGanttChartOutline,
        IconPlus,
        IconRows,
        IconSearch
    } from '~/lib/components/icons';
    import { paginatedList } from '~/lib/models/paginatedList';
    import { permissions } from '~/lib/models/permission';
    import { mapMaybePromise } from '~/lib/utils/promise';
    import { createRef } from '~/lib/utils/runes.svelte';
    import { fluentSearchParams } from '~/lib/utils/url';
    import type { PageData } from './$types';
    import type { LocalIssue, LocalWorkspaceStatus } from './+page.server';
    import TableLayout from './TableLayout.svelte';
    import BoardLayout from './_board/BoardLayout.svelte';
    import TimelineLayout from './_timeline/TimelineLayout.svelte';

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
    const timelineIssueListRef = createRef.maybePromise(() =>
        data.page.tag === 'timeline' ? data.page.issueList : undefined
    );
    const timelineMilestoneListRef = createRef.maybePromise(() =>
        data.page.tag === 'timeline' ? data.page.milestoneList : undefined
    );
    const tabsBuilder = new Tabs.Builder({
        value: () =>
            data.page.tag === 'board'
                ? 'board'
                : data.page.tag === 'timeline'
                  ? 'timeline'
                  : 'table'
    });
    const getProjectPermissionsRef = createRef.maybePromise(() => data.getProjectPermissions);
    const can = $derived({
        create: getProjectPermissionsRef.value?.has(permissions.createIssue) ?? false
    });
    const updateSearch = makeControlledDebounce(
        (value: string) => {
            const searchParams = fluentSearchParams(page.url);
            if (value.length === 0) {
                searchParams.delete('q');
            } else {
                searchParams.set('q', value);
            }
            goto(`${page.url.pathname}${searchParams.toString()}`, {
                replaceState: true,
                keepFocus: true,
                noScroll: true,
                invalidateAll: true
            });
        },
        {
            leading: true,
            delay: 250
        }
    );
</script>

<Main>
    <div class="min-h-screen-sm grid h-full grid-rows-[auto_auto_1fr] gap-4">
        <div>
            <h1>Tasks</h1>
            <p class="c-text-secondary text-pretty">
                Create, track, and resolve tasks—keep your project aligned, focused and fast-moving.
            </p>
        </div>
        <div class="flex items-center justify-between gap-2">
            <div class="flex gap-2">
                <div class="relative">
                    <IconSearch class="text-base-fg-5 absolute left-2 top-1/2 -translate-y-1/2" />
                    <Input
                        type="text"
                        placeholder="Search tasks..."
                        class="h-full w-fit pl-8"
                        value={page.url.searchParams.get('q') ?? ''}
                        oninput={(e) => {
                            updateSearch.schedule(e.currentTarget.value);
                        }}
                    />
                </div>
                <Tabs
                    {...tabsBuilder.triggerList}
                    class="border-base-border-3 gap-0 border p-0 *:rounded-none *:px-4 *:first:rounded-l-md *:last:rounded-r-md sm:w-fit bg-transparent"
                >
                    <a
                        {...tabsBuilder.getTrigger('table')}
                        href="{page.url.pathname}{fluentSearchParams(page.url).delete('view')}"
                        class="c-tab--trigger flex items-center gap-2"
                        style="--_bg-selected: var(--color-base-selected);"
                        data-sveltekit-preload-data="hover"
                        data-sveltekit-replacestate
                    >
                        <IconRows />
                        Table
                    </a>
                    <a
                        {...tabsBuilder.getTrigger('board')}
                        href="{page.url.pathname}{fluentSearchParams(page.url).set(
                            'view',
                            'board'
                        )}"
                        class="c-tab--trigger flex items-center gap-2"
                        style="--_bg-selected: var(--color-base-selected);"
                        data-sveltekit-preload-data="hover"
                        data-sveltekit-replacestate
                    >
                        <IconColumns />
                        Board
                    </a>
                    <a
                        {...tabsBuilder.getTrigger('timeline')}
                        href="{page.url.pathname}{fluentSearchParams(page.url).set(
                            'view',
                            'timeline'
                        )}"
                        class="c-tab--trigger flex items-center gap-2"
                        style="--_bg-selected: var(--color-base-selected);"
                        data-sveltekit-preload-data="hover"
                        data-sveltekit-replacestate
                    >
                        <IconGanttChartOutline />
                        Timeline
                    </a>
                </Tabs>
            </div>
            {#if can.create}
                <Button
                    as="link"
                    href={createIssueHref}
                    variant="primary"
                    class="flex w-fit items-center gap-2 text-nowrap capitalize max-sm:justify-center"
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
                        issueLists={data.page.issueLists}
                        projectId={data.project.id}
                        projectIdentifier={data.project.identifier}
                    />
                </div>
            {:else if data.page.tag === 'timeline'}
                <div class="h-full">
                    <TimelineLayout
                        workspacePath={page.params.path}
                        projectIdentifier={data.project.identifier}
                        issueListRef={timelineIssueListRef}
                        milestoneListRef={timelineMilestoneListRef}
                    />
                </div>
            {:else}
                <div class="h-full px-4">
                    <TableLayout issueListRef={tableIssueListRef} />
                </div>
            {/if}
        </div>
    </div>
</Main>
