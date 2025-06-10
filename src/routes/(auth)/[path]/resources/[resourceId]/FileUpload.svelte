<script lang="ts">
    import { FileUpload } from 'melt/builders';
    import { SvelteMap } from 'svelte/reactivity';
    import { Field, IconButton, toast } from '~/lib/components';
    import { IconUploadOutline, IconXMark } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { errorCodes } from '~/lib/models/errors';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { formatFileSize } from '~/lib/utils/commons';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import { attempt, type Attempt } from '~/lib/utils/try';
    import { createUploads } from '../utils';
    import type { LocalResourceFile } from './+page.server';

    const {
        workspaceId,
        resourceId,
        fileListRef
    }: {
        workspaceId: string;
        resourceId: string;
        fileListRef: Ref<PaginatedList<LocalResourceFile> | undefined>;
    } = $props();

    const { api } = useRuntime();
    const fileUpload = new FileUpload({
        multiple: true,
        onSelectedChange: (selected) => {
            uploadFiles(Array.from(selected.values()));
            selected.clear();
        }
    });
    const uploads = new SvelteMap<number, { file: File; progress: number; abort: () => void }>();
    let id = 0;

    const uploadFiles = async (files: File[]) => {
        const createUploadsAttempt = await createUploads(api)(workspaceId, files);
        if (createUploadsAttempt.failed) {
            toast({
                type: 'negative',
                body: 'Something went wrong while trying to upload the files',
                footer: createUploadsAttempt.error
            });
            return;
        }

        const size = 8;
        const partitions = Array.from(
            { length: Math.ceil(createUploadsAttempt.data.length / size) },
            (_, i) => createUploadsAttempt.data.slice(i * size, i * size + size)
        );

        const uploadAttempts: {
            file: File;
            key: string;
            pendingUploadId: number;
            attempt: Attempt<void, string>;
        }[] = [];

        for (const partition of partitions) {
            const results = await Promise.all(
                partition.map(async (a) => {
                    const currentId = ++id;
                    uploads.set(currentId, {
                        file: a.file,
                        progress: 0,
                        abort: () => {
                            a.xhr.abort();
                        }
                    });
                    a.xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            const value = uploads.get(currentId);
                            if (!value) {
                                return;
                            }
                            uploads.set(currentId, {
                                ...value,
                                progress: (e.loaded / e.total) * 100
                            });
                        }
                    };
                    a.xhr.send(a.file);
                    const uploadAttempt = await a.promise;
                    return {
                        id: currentId,
                        file: a.file,
                        key: a.key,
                        pendingUploadId: a.pendingUploadId,
                        attempt: uploadAttempt
                    };
                })
            );
            for (const result of results) {
                uploads.delete(result.id);
            }
            uploadAttempts.push(...results);
        }

        for (const result of uploadAttempts) {
            if (!result.attempt.ok) {
                toast({
                    type: 'negative',
                    body: `Something went wrong while trying to upload the file '${result.file.name}'`,
                    footer: result.attempt.error
                });
            }
        }

        const successfulAttempts = uploadAttempts.filter((a) => a.attempt.ok);
        const createFilesAttempt = await attempt.promise(() =>
            api.post('resource-files/batch', {
                body: {
                    files: successfulAttempts.map((a) => ({
                        resourceId,
                        key: a.key,
                        originalName: a.file.name,
                        mimeType: a.file.type,
                        size: a.file.size
                    }))
                }
            })
        )(errorCodes.fromFetch);

        if (!createFilesAttempt.ok) {
            toast({
                type: 'negative',
                body: 'Something went wrong while trying to create files',
                footer: createFilesAttempt.error
            });
            return;
        }

        const jsonAttempt = await attempt.promise(() =>
            createFilesAttempt.data.json<{ ids: string[] }>()
        )(errorCodes.fromJson);

        if (!jsonAttempt.ok) {
            toast({
                type: 'negative',
                body: 'Something went wrong while trying to parse the upload response',
                footer: jsonAttempt.error
            });
            return;
        }

        toast({
            type: 'positive',
            body: 'Files uploaded successfully.'
        });

        const nowIso = new Date().toISOString();
        fileListRef.value = paginatedList({
            items: [
                ...jsonAttempt.data.ids.map((a, i) => {
                    const attempt = successfulAttempts[i];
                    return {
                        id: a,
                        createdTime: nowIso,
                        updatedTime: nowIso,
                        key: attempt.key,
                        originalName: attempt.file.name,
                        size: attempt.file.size,
                        mimeType: attempt.file.type
                    };
                }),
                ...(fileListRef.value?.items ?? [])
            ],
            totalCount: (fileListRef.value?.totalCount ?? 0) + jsonAttempt.data.ids.length
        });
    };
</script>

<Field>
    <input {...fileUpload.input} />
    <div
        {...fileUpload.dropzone}
        class="border-base-border-2 hover:border-base-border-hover data-[dragging]:border-primary-border rounded-lg border-2 border-dashed p-4 text-center transition"
    >
        <IconUploadOutline class="text-base-fg-5 mx-auto size-16" />
        <p class="c-label mx-auto">
            {#if fileUpload.isDragging}
                <strong>Drop your files</strong> here to upload
            {:else}
                <strong>Click to upload</strong> or drag and drop
            {/if}
        </p>
    </div>
    <p class="c-label ml-auto mt-4">
        {#if uploads.size > 0}
            <strong>{uploads.size}</strong> files selected ·
            <strong>
                {formatFileSize(
                    Array.from(uploads.values()).reduce((acc, cur) => acc + cur.file.size, 0)
                )}
            </strong>
        {/if}
    </p>
    {#if uploads.size > 0}
        <ol>
            {#each uploads as [key, { file, progress, abort }] (key)}
                {@const upload = uploads.get(key)}
                <li class="flex items-center justify-between gap-8">
                    <div
                        class="overflow-hidden *:overflow-hidden *:text-ellipsis *:whitespace-nowrap"
                    >
                        <p class="mt-2 font-medium">
                            <strong>
                                {file.name}
                            </strong>
                        </p>
                        <p></p>
                        {#if upload || file.type}
                            <p class="c-label">
                                {#if upload}
                                    <span class="text-positive-1">
                                        Upload: {Math.round(progress * 100) / 100}%
                                    </span>
                                {/if}
                                {#if upload && file.type}<span>·</span>{/if}
                                {#if file.type}<span>{file.type}</span>{/if}
                            </p>
                        {/if}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="c-label text-nowrap">{formatFileSize(file.size)}</span>
                        <IconButton
                            type="button"
                            variant="negative"
                            onclick={() => {
                                abort();
                                uploads.delete(key);
                                fileUpload.remove(file);
                            }}
                        >
                            <IconXMark />
                        </IconButton>
                    </div>
                </li>
            {/each}
        </ol>
    {/if}
</Field>
