<script lang="ts">
    import { page } from '$app/state';
    import { Button, Main, Tabs } from '~/lib/components';
    import { IconColumns, IconPlus, IconRows } from '~/lib/components/icons';
    import { createRef } from '~/lib/utils/runes.svelte';
    import { fluentSearchParams } from '~/lib/utils/url';
    import type { PageData } from './$types';
    import TableLayout from './TableLayout.svelte';
    import BoardLayout from './_board/BoardLayout.svelte';
    import { permissions } from '~/lib/models/permission';

    const { data }: { data: PageData } = $props();
    const createIssueHref = $derived(page.url.pathname + '/new');
    const tableIssueListRef = createRef.maybePromise(() =>
        data.page.tag === 'table' ? data.page.issueList : null
    );
    const boardIssueListsRef = createRef.maybePromise(() =>
        data.page.tag === 'board' ? data.page.issueLists : null
    );
    const boardStatusListRef = createRef.maybePromise(() =>
        data.page.tag === 'board' ? data.page.statusList : null
    );
    const tabsBuilder = new Tabs.Builder({
        value: page.url.searchParams.get('view') === 'board' ? 'board' : 'table'
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
                    data-sveltekit-replacestate
                >
                    <IconRows />
                    Table
                </a>
                <a
                    {...tabsBuilder.getTrigger('board')}
                    href="{page.url.pathname}{fluentSearchParams(page.url).set('view', 'board')}"
                    class="c-tab--trigger flex items-center gap-2"
                    data-sveltekit-replacestate
                >
                    <IconColumns />
                    Board
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
            <div {...tabsBuilder.getContent('table')} class="h-full px-4">
                <TableLayout issueListRef={tableIssueListRef} />
            </div>
            <div {...tabsBuilder.getContent('board')} class="h-full">
                <BoardLayout
                    statusListRef={boardStatusListRef}
                    issueListsRef={boardIssueListsRef}
                    projectId={data.project.id}
                    projectIdentifier={data.project.identifier}
                />
            </div>
        </div>
    </div>
</Main>
