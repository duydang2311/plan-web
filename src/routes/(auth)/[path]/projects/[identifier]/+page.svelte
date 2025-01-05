<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { QueryResponse } from '~/lib/utils/query';
    import type { PageData } from './$types';
    import type { LocalProject } from './+page.server';
    import { createProjectQueryParams } from './utils';
    import { page } from '$app/state';
    import { DateTime } from 'luxon';
    import IssueCard from './IssueCard.svelte';
    import TeamCard from './TeamCard.svelte';
    import MemberCard from './MemberCard.svelte';
    import IssueList from './IssueList.svelte';

    const { data }: { data: PageData } = $props();
    const { api } = useRuntime();
    const query = createQuery(
        toStore(() => {
            const params = createProjectQueryParams();
            return {
                queryKey: ['projects', { id: data.project.id, ...params }],
                queryFn: async () => {
                    const response = await QueryResponse.HTTP(() =>
                        api.get(`projects/${data.project.id}`, { query: params })
                    );
                    const json = await QueryResponse.JSON(() => response.json<LocalProject>());
                    return {
                        ...data.project,
                        description: json.description,
                        createdTime: json.createdTime
                    };
                }
            };
        })
    );
</script>

<main class="px-8 py-4 mx-auto max-w-paragraph-lg overflow-auto h-full">
    {#if $query.isPending}
        Loading...
    {:else if $query.data}
        <h1 class="text-h1">
            {$query.data.name}
        </h1>
        <p class="c-label">
            {page.params.identifier} · created {DateTime.fromISO(
                $query.data.createdTime
            ).toRelative()}
        </p>
        {#if $query.data.description != null}
            <p class="mt-8">
                {$query.data.description ?? 'Description not available.'}
            </p>
        {/if}
    {/if}

    <div class="flex flex-wrap *:basis-48 gap-4 mt-8">
        <IssueCard projectId={data.project.id} />
        <MemberCard projectId={data.project.id} />
        <TeamCard projectId={data.project.id} />
    </div>

    <IssueList projectId={data.project.id} />
</main>
