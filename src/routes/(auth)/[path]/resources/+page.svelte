<script lang="ts" module>
    declare global {
        namespace App {
            interface PageState {
                deletingWorkspaceResource?: LocalWorkspaceResource;
            }
        }
    }
</script>

<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import { omit } from '@baetheus/fun/record';
    import { Resize } from '@cloudinary/url-gen/actions';
    import { toStore } from 'svelte/store';
    import { Avatar, Input, Link, Main, OptionalLink, RelativeTime } from '~/lib/components';
    import { IconSearch, IconResources } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { permissions } from '~/lib/models/permission';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { mapMaybePromise } from '~/lib/utils/promise';
    import { createRef, watch } from '~/lib/utils/runes.svelte';
    import type { PageData } from './$types';
    import type { LocalWorkspaceResource } from './+page.server';
    import CreateResourceButton from './CreateResourceButton.svelte';
    import DeleteResourceDialog from './DeleteResourceDialog.svelte';
    import MenuPopover from './MenuPopover.svelte';

    const { data }: { data: PageData } = $props();
    const { cloudinary } = useRuntime();
    const getResourcesRef = createRef.maybePromise(() => data.getResources);
    const resourceListRef = createRef.maybePromise(() =>
        mapMaybePromise(data.getResources)((a) => (a.ok ? a.data : undefined))
    );
    const workspacePermissionsRef = createRef.maybePromise(() => data.workspacePermissions);

    let openDeleteWorkspaceDialog = $state.raw(page.state.deletingWorkspaceResource != null);
    let deletingWorkspaceResource = $state.raw<LocalWorkspaceResource | null>(
        page.state.deletingWorkspaceResource ?? null
    );
    const can = $derived({
        create: workspacePermissionsRef.value?.has(permissions.createWorkspaceResource) ?? false,
        delete: workspacePermissionsRef.value?.has(permissions.deleteWorkspaceResource) ?? false
    });

    const showDeleteWorkspaceResourceDialog = (wr: LocalWorkspaceResource) => {
        deletingWorkspaceResource = wr;
        openDeleteWorkspaceDialog = true;
        replaceState('', { ...page.state, deletingWorkspaceResource: wr });
    };

    watch(() => openDeleteWorkspaceDialog)(() => {
        if (!openDeleteWorkspaceDialog && page.state.deletingWorkspaceResource) {
            replaceState('', omit('deletingWorkspaceResource')(page.state));
        }
    });
</script>

<DeleteResourceDialog
    open={toStore(
        () => openDeleteWorkspaceDialog,
        (a) => {
            openDeleteWorkspaceDialog = a;
        }
    )}
    workspaceResource={deletingWorkspaceResource}
    {resourceListRef}
    onSubmit={() => {
        openDeleteWorkspaceDialog = false;
    }}
/>

{#snippet empty()}
    <div class="flex flex-1 flex-col items-center justify-center">
        <IconResources class="text-base-fg-ghost size-24" />
        <p class="text-base-fg-ghost">No resources found.</p>
    </div>
{/snippet}

<Main class="overflow-auto p-4">
    <div class="flex min-h-full flex-col overflow-hidden">
        <div class="mb-4 sm:flex sm:items-center sm:justify-between sm:gap-x-16 sm:gap-y-4">
            <div class="max-lg:mb-2">
                <h1 class="font-h-bold">Resources</h1>
                <p class="c-text-secondary text-pretty">
                    One place to access every file and document in your workspace — collaborate
                    effortlessly and stay productive.
                </p>
            </div>
            <div class="flex flex-wrap justify-end gap-4 *:basis-52 max-sm:*:flex-1">
                <div class="relative">
                    <Input type="text" placeholder="Search resources..." class="pl-8" />
                    <IconSearch class="text-base-fg-5 absolute left-2 top-1/2 -translate-y-1/2" />
                </div>
                {#if can.create}
                    <CreateResourceButton
                        workspaceId={data.workspace.id}
                        {resourceListRef}
                        user={data.user}
                    />
                {/if}
            </div>
        </div>
        {#if getResourcesRef.value == null}
            {#if getResourcesRef.loading.immediate}
                <span class="c-text-secondary">Loading...</span>
            {:else}
                {@render empty()}
            {/if}
        {:else if !getResourcesRef.value.ok}
            An error occurred while trying to fetch resources.
            <pre>{JSON.stringify(getResourcesRef.value.error)}</pre>
        {:else if getResourcesRef.value.data.items.length === 0}
            {@render empty()}
        {:else if resourceListRef.value}
            <div class="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
                {#each resourceListRef.value.items as wr (wr.resource.id ?? wr.resource.optimisticId)}
                    <div
                        class="border-base-border-3 shadow-xs dark:bg-base-3 dark:border-t-base-border-1 flex flex-col overflow-hidden rounded-lg border"
                    >
                        <Link href="/{page.params.path}/resources/{wr.resource.id}">
                            <div class="bg-base-2 aspect-video w-full rounded-md"></div>
                        </Link>
                        <div class="flex grow flex-col gap-4 p-2">
                            <div>
                                <div class="flex items-center justify-between gap-4">
                                    <Link
                                        href="/{page.params.path}/resources/{wr.resource.id}"
                                        class="text-h6 text-base-fg-1 mb-1 font-bold"
                                    >
                                        {wr.resource.name}
                                    </Link>
                                    {#if wr.resource.id && (data.user.id === wr.resource.creator.id || can.delete)}
                                        <MenuPopover
                                            onDelete={() => {
                                                showDeleteWorkspaceResourceDialog(wr);
                                            }}
                                        />
                                    {/if}
                                </div>
                                {#if wr.resource.document?.previewContent}
                                    <p class="c-label">
                                        {wr.resource.document.previewContent}
                                    </p>
                                {/if}
                            </div>
                            <div class="flex items-center gap-2">
                                {#if wr.resource.previewFileCount > 0}
                                    <p class="c-label text-base-fg-5">
                                        {wr.resource.previewFileCount} files
                                    </p>
                                {/if}
                                {#if wr.resource.previewFileMimeTypes && wr.resource.previewFileMimeTypes.length > 0}
                                    <ul class="flex flex-wrap gap-2">
                                        {#each wr.resource.previewFileMimeTypes as mimeType (mimeType)}
                                            <li
                                                class="border-base-border-3 rounded-full border px-2.5 py-0.5 text-xs font-bold"
                                            >
                                                {mimeType}
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                            </div>
                            <div class="mt-auto flex flex-wrap items-center justify-between gap-2">
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
    </div>
</Main>
