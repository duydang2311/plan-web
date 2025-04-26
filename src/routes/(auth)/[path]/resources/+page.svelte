<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { Avatar, IconButton, Input, Main, OptionalLink, RelativeTime } from '~/lib/components';
    import { IconDownloadOutline, IconSearch } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { createRef } from '~/lib/utils/runes.svelte';
    import type { PageData } from './$types';
    import CreateResourceButton from './CreateResourceButton.svelte';

    const { data }: { data: PageData } = $props();
    const { cloudinary } = useRuntime();
    const getResourcesRef = createRef.maybePromise(() => data.getResources);
    const resourceListRef = createRef(() =>
        getResourcesRef.value && getResourcesRef.value.ok ? getResourcesRef.value.data : null
    );
</script>

<Main class="p-4">
    <div class="mb-4 sm:flex sm:items-center sm:justify-between sm:gap-x-16 sm:gap-y-4">
        <div class="max-lg:mb-2">
            <h1>Resources</h1>
            <p class="c-label text-pretty">
                One place to access every file and document in your workspace — collaborate
                effortlessly and stay productive.
            </p>
        </div>
        <div class="flex flex-wrap justify-end gap-4 *:basis-52 max-sm:*:flex-1">
            <div class="relative">
                <Input type="text" placeholder="Search resources..." class="pl-8" />
                <IconSearch class="text-base-fg-5 absolute left-2 top-1/2 -translate-y-1/2" />
            </div>
            <CreateResourceButton
                workspaceId={data.workspace.id}
                {resourceListRef}
                user={data.user}
            />
        </div>
    </div>
    {#if getResourcesRef.value == null}
        {#if getResourcesRef.loading.immediate}
            <span class="c-label">Loading...</span>
        {:else}
            <span class="c-label">No resources found.</span>
        {/if}
    {:else if !getResourcesRef.value.ok}
        An error occurred while trying to fetch resources.
        <pre>{JSON.stringify(getResourcesRef.value.error)}</pre>
    {:else if getResourcesRef.value.data.items.length === 0}
        <span class="c-label">No resources found.</span>
    {:else if resourceListRef.value}
        <div class="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
            {#each resourceListRef.value.items as wr (wr.resource.id ?? wr.resource.optimisticId)}
                <div
                    class="border-base-border-3 shadow-xs dark:bg-base-3 dark:border-t-base-border-1 flex flex-col overflow-hidden rounded-lg border"
                >
                    <div class="bg-base-2 aspect-video w-full rounded-md"></div>
                    <div class="flex grow flex-col gap-4 p-2">
                        <div>
                            <p class="text-h6 text-base-fg-1 mb-1 font-bold">{wr.resource.name}</p>
                            <p class="c-label">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam
                                laudantium maxime ratione minus reprehenderit.
                            </p>
                        </div>
                        {#if wr.resource.files && wr.resource.files.length > 0}
                            <div class="flex items-start justify-between gap-4">
                                <ul class="flex flex-wrap gap-2">
                                    {#each new Set(wr.resource.files.map((a) => a.key
                                                .split('.')
                                                .pop())).values() as ext (ext)}
                                        <li
                                            class="border-base-border-3 rounded-full border px-2.5 py-0.5 text-xs font-bold"
                                        >
                                            {ext}
                                        </li>
                                    {/each}
                                </ul>
                                <IconButton variant="base" title="Download files">
                                    <IconDownloadOutline />
                                </IconButton>
                            </div>
                        {/if}
                        <div class="mt-auto flex items-center justify-between">
                            <OptionalLink
                                href={wr.resource.creator.profile
                                    ? `/profiles/${wr.resource.creator.profile.name}`
                                    : undefined}
                            >
                                <div class="flex items-center gap-2">
                                    <Avatar
                                        seed={wr.resource.creator.profile?.name ??
                                            wr.resource.creator.email}
                                        src={imageFromAsset(cloudinary)(
                                            wr.resource.creator.profile?.image
                                        )
                                            ?.resize(Resize.fill(64))
                                            .toURL()}
                                        class="size-avatar-sm"
                                    />
                                    <span>
                                        {wr.resource.creator.profile?.displayName ??
                                            wr.resource.creator.email}
                                    </span>
                                </div>
                            </OptionalLink>
                            <span class="c-label">
                                created <RelativeTime time={wr.resource.createdTime} />
                            </span>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</Main>
