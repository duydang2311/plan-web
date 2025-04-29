<script lang="ts">
    import { FileUpload } from 'melt/builders';
    import { SvelteMap } from 'svelte/reactivity';
    import { Field, IconButton, Label } from '~/lib/components';
    import { IconUploadOutline, IconXMark } from '~/lib/components/icons';
    import { formatFileSize } from '~/lib/utils/commons';

    const {
        files,
        uploads
    }: {
        files: SvelteMap<string, File>;
        uploads: SvelteMap<string, { progress: number; abort: () => void }>;
    } = $props();
    const fileUpload = new FileUpload({
        multiple: true,
        onSelectedChange: (selected) => {
            for (const file of selected) {
                files.set(file.name, file);
            }

            const set = new Set(Array.from(selected).map((a) => a.name));
            for (const [name] of files) {
                if (!set.has(name)) {
                    files.delete(name);
                }
            }
        }
    });
</script>

<Field>
    <Label for={fileUpload.input.id}>Files</Label>
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
        {#if files.size > 0}
            <strong>{files.size}</strong> files selected ·
            <strong>
                {formatFileSize(Array.from(files.values()).reduce((acc, cur) => acc + cur.size, 0))}
            </strong>
        {/if}
    </p>
    {#if files.size > 0}
        <ol>
            {#each files as [key, file] (key)}
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
                                        Upload: {uploads.get(file.name)?.progress}%
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
                                const upload = uploads.get(file.name);
                                if (upload) {
                                    upload.abort();
                                    uploads.delete(file.name);
                                }
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
