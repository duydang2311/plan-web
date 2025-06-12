<script lang="ts" module>
    import type { ResourceFile } from '~/lib/models/resource';

    declare global {
        namespace App {
            interface PageState {
                deletingResourceFile?: ResourceFile;
            }
        }
    }
</script>

<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import { omit } from '@baetheus/fun/record';
    import { toStore } from 'svelte/store';
    import { Main, RelativeTime, toast } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { errorCodes } from '~/lib/models/errors';
    import { permissions } from '~/lib/models/permission';
    import { formatFileSize } from '~/lib/utils/commons';
    import {
        stringifyActionFailureErrors,
        validateActionFailureData
    } from '~/lib/utils/kit.client';
    import { mapMaybePromise } from '~/lib/utils/promise';
    import { createRef, watch } from '~/lib/utils/runes.svelte';
    import { formatDateUi } from '~/lib/utils/time';
    import { attempt } from '~/lib/utils/try';
    import type { PageData } from './$types';
    import type { LocalResourceFile } from './+page.server';
    import DeleteFileDialog from './DeleteFileDialog.svelte';
    import Document from './Document.svelte';
    import FileUpload from './FileUpload.svelte';
    import MenuPopover from './MenuPopover.svelte';
    import Title from './Title.svelte';

    const { data }: { data: PageData } = $props();

    const { api } = useRuntime();
    const getWorkspaceResourceRef = createRef.maybePromise(() => data.getWorkspaceResource);
    const resourceRef = createRef.maybePromise(() =>
        mapMaybePromise(data.getWorkspaceResource)((a) => (a.ok ? a.data.resource : undefined))
    );
    const fileListRef = createRef.maybePromise(() =>
        mapMaybePromise(data.getResourceFileList)((a) => (a.ok ? a.data : undefined))
    );
    const workspacePermissionsRef = createRef.maybePromise(() => data.workspacePermissions);
    const can = $derived({
        delete:
            (data.user.id === resourceRef.value?.creator.id ||
                workspacePermissionsRef.value?.has(permissions.deleteWorkspaceResourceFile)) ??
            false
    });
    $inspect(fileListRef.value, data.getResourceFileList);
    let openDeleteFileDialog = $state.raw(false);

    const downloadFile = async (resourceFile: LocalResourceFile) => {
        const exchangeTokenAttempt = await attempt.promise(() =>
            api.post('workspace-resources/token', {
                body: { workspaceId: data.workspace.id, resourceFileId: resourceFile.id }
            })
        )(errorCodes.fromFetch);
        if (exchangeTokenAttempt.failed) {
            toast({
                type: 'negative',
                body: 'Something went wrong while trying to download the file.',
                footer: exchangeTokenAttempt.error
            });
            return;
        }

        const jsonAttempt = await attempt.promise(() =>
            exchangeTokenAttempt.data.json<{ accessToken: string }>()
        )(errorCodes.fromJson);
        if (jsonAttempt.failed) {
            toast({
                type: 'negative',
                body: 'Something went wrong while trying to download the file.',
                footer: jsonAttempt.error
            });
            return;
        }

        const fetchAttempt = await attempt.promise(() =>
            fetch(`https://coop-worker.duyda.tech/${resourceFile.key}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${jsonAttempt.data.accessToken}`
                }
            })
        )(errorCodes.fromFetch);
        if (fetchAttempt.failed || !fetchAttempt.data.ok) {
            toast({
                type: 'negative',
                body: 'Something went wrong while trying to download the file.',
                footer: fetchAttempt.failed ? fetchAttempt.error : fetchAttempt.data.status + ''
            });
            return;
        }

        const blobAttempt = await attempt.promise(() => fetchAttempt.data.blob())(() => 'blob');
        if (blobAttempt.failed) {
            toast({
                type: 'negative',
                body: 'Something went wrong while trying to download the file.',
                footer: blobAttempt.error
            });
            return;
        }

        const blobUrl = URL.createObjectURL(blobAttempt.data);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = resourceFile.originalName;

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            document.body.removeChild(link);
        }, 100);
    };

    watch(() => page.state.deletingResourceFile)(() => {
        if (page.state.deletingResourceFile) {
            openDeleteFileDialog = true;
        }
    });
</script>

{#snippet successToast(name: string)}
    Resource name updated to <strong>'{name}'</strong>.
{/snippet}

<DeleteFileDialog
    open={toStore(
        () => openDeleteFileDialog,
        (a) => {
            openDeleteFileDialog = a;
            if (!a) {
                replaceState('', omit('deletingResourceFile')(page.state));
            }
        }
    )}
    resourceFile={page.state.deletingResourceFile ?? null}
    {fileListRef}
    onSubmit={() => {
        openDeleteFileDialog = false;
        replaceState('', omit('deletingResourceFile')(page.state));
    }}
/>

<Main>
    <div class="max-w-desktop mx-auto">
        {#if getWorkspaceResourceRef.isInitialLoading}
            <p class="c-label">Loading...</p>
        {:else if resourceRef.value == null || getWorkspaceResourceRef.value == null || !getWorkspaceResourceRef.value.ok}
            <p class="c-label">An error occurred while loading the resource.</p>
            {#if getWorkspaceResourceRef.value != null && !getWorkspaceResourceRef.value.ok}
                <pre>{JSON.stringify(getWorkspaceResourceRef.value.error)}</pre>
            {/if}
        {:else}
            {@const name = resourceRef.value.name}
            <section>
                <Title
                    {name}
                    onSubmit={async (e) => {
                        const old = resourceRef.value;
                        if (!old) {
                            e.cancel();
                            return;
                        }

                        const name = (e.formData.get('name') as string | null) ?? '';
                        if (name == null || name.trim() === old.name) {
                            e.cancel();
                            return;
                        }

                        e.formData.set('resourceId', old.id);
                        resourceRef.value = {
                            ...old,
                            name
                        };
                        return async ({ result, update }) => {
                            if (result.type === 'success') {
                                toast({
                                    type: 'positive',
                                    // @ts-ignore
                                    body: successToast,
                                    bodyProps: name
                                });
                            } else if (result.type === 'failure') {
                                const data = validateActionFailureData(result.data);
                                toast({
                                    type: 'negative',
                                    body: 'An error occurred while updating the resource name.',
                                    footer: stringifyActionFailureErrors(
                                        data.ok ? data.data.errors : data.errors
                                    )
                                });
                                resourceRef.value = old;
                            }
                            await update();
                        };
                    }}
                />
                <p class="c-text-secondary">
                    Created on {formatDateUi(resourceRef.value.createdTime)} • Last modified <RelativeTime
                        time={resourceRef.value.updatedTime}
                    />.
                </p>
            </section>
            <Document
                content={resourceRef.value.document?.content}
                onSubmit={(e) => {
                    const old = resourceRef.value;
                    if (!old) {
                        e.cancel();
                        return;
                    }

                    const content = (e.formData.get('content') as string | null) ?? '';
                    if (content == null || content.trim() === old.name) {
                        e.cancel();
                        return;
                    }

                    e.formData.set('resourceId', old.id);
                    resourceRef.value = {
                        ...old,
                        document: {
                            ...old.document,
                            content,
                            previewContent: content
                        }
                    };
                    return async ({ result, update }) => {
                        if (result.type === 'success') {
                            toast({
                                type: 'positive',
                                // @ts-ignore
                                body: successToast,
                                bodyProps: content
                            });
                        } else if (result.type === 'failure') {
                            const data = validateActionFailureData(result.data);
                            toast({
                                type: 'negative',
                                body: 'An error occurred while updating the resource name.',
                                footer: stringifyActionFailureErrors(
                                    data.ok ? data.data.errors : data.errors
                                )
                            });
                            resourceRef.value = old;
                        }
                        await update();
                    };
                }}
            />
            <section class="mt-8">
                <h2 class="mb-2">Files</h2>
                <FileUpload
                    workspaceId={data.workspace.id}
                    {fileListRef}
                    resourceId={resourceRef.value.id}
                />
                {#if fileListRef.value && fileListRef.value.items.length > 0}
                    <ul class="grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-4">
                        {#each fileListRef.value.items as file (file.key)}
                            <li>
                                <div
                                    class="border-base-border-3 dark:bg-base-3 wrap-anywhere flex h-full items-start justify-between gap-x-4 gap-y-2 rounded-lg border p-2"
                                >
                                    <div class="flex h-full flex-col justify-between">
                                        <p class="text-h6">
                                            {file.originalName}
                                        </p>
                                        <p class="c-label">
                                            {file.mimeType} - {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                    <MenuPopover
                                        canDelete={can.delete}
                                        onDownload={() => {
                                            downloadFile(file);
                                        }}
                                        onDelete={() => {
                                            replaceState('', {
                                                ...page.state,
                                                deletingResourceFile: file
                                            });
                                        }}
                                    />
                                </div>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </section>
        {/if}
    </div>
</Main>
