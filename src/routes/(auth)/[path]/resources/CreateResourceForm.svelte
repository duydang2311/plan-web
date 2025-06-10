<script lang="ts">
    import { enhance } from '$app/forms';
    import { Editor } from '@tiptap/core';
    import { DateTime } from 'luxon';
    import { Toggle } from 'melt/builders';
    import { SvelteMap } from 'svelte/reactivity';
    import {
        Button,
        Errors,
        Field,
        Input,
        Label,
        LoadingMonitor,
        TiptapEditor,
        toast
    } from '~/lib/components';
    import { IconPlus, IconResourcePlus } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { UserPreset } from '~/lib/models/user';
    import { createForm } from '~/lib/utils/form.svelte';
    import {
        stringifyActionFailureErrors,
        validateActionFailureData
    } from '~/lib/utils/kit.client';
    import { createDirty, createLoading, watch, type Ref } from '~/lib/utils/runes.svelte';
    import { type Attempt } from '~/lib/utils/try';
    import type { LocalWorkspaceResource } from './+page.server';
    import CreateResourceFileUpload from './CreateResourceFileUpload.svelte';
    import { createUploads } from './utils';

    const {
        workspaceId,
        resourceListRef,
        user
    }: {
        workspaceId: string;
        resourceListRef: Ref<PaginatedList<LocalWorkspaceResource> | undefined>;
        user: UserPreset['basicProfile'];
    } = $props();
    const { api } = useRuntime();
    const form = createForm();
    const fields = {
        workspaceId: form.createField({
            name: 'workspaceId',
            initialValue: workspaceId,
            validateOnDirty: false,
            validateOnTouched: false
        }),
        name: form.createField({
            name: 'name',
            initialValue: '',
            validator: (state, { error }) => {
                if (state.value.length === 0) {
                    error('required');
                }
            }
        }),
        content: form.createField({
            name: 'content',
            validator: (_state, { error }) => {
                if (editor == null || !toggle.value) {
                    return;
                }
                if (editor.isEmpty) {
                    error('required');
                }
            }
        })
    };
    const files = new SvelteMap<string, File>();
    const uploads = new SvelteMap<string, { progress: number; abort: () => void }>();
    const loading = createLoading();
    let rootErrors = $state.raw<string[]>([]);

    let editor = $state.raw<Editor>();
    const dirty = createDirty();

    watch(() => fields.content.state.errors)(() => {
        if (fields.content.state.errors == null || fields.content.state.errors.length === 0) {
            editor?.setOptions({
                editorProps: {
                    attributes: {
                        class: (editor.options.editorProps.attributes as Record<string, string>)
                            .class
                    }
                }
            });
            return;
        }

        editor?.setOptions({
            editorProps: {
                attributes: {
                    class: (editor.options.editorProps.attributes as Record<string, string>).class,
                    'aria-invalid': ''
                }
            }
        });
    });

    const toggle = new Toggle();

    watch(() => toggle.value)(() => {
        if (!toggle.value) {
            dirty.unset();
            fields.content.setErrors();
        }
    });

    const uploadFiles = async (workspaceId: string, files: File[]) => {
        const createUploadsAttempt = await createUploads(api)(workspaceId, files);
        if (!createUploadsAttempt.ok) {
            toast({
                type: 'negative',
                body: `An error occurred while trying to upload files (code: ${createUploadsAttempt.error}).`
            });
            return;
        }

        const size = 8;
        const partitions = Array.from(
            { length: Math.ceil(createUploadsAttempt.data.length / size) },
            (_, i) => createUploadsAttempt.data.slice(i * size, i * size + size)
        );

        const uploadResults: {
            file: File;
            key: string;
            pendingUploadId: number;
            attempt: Attempt<void, string>;
        }[] = [];

        for (const partition of partitions) {
            const results = await Promise.all(
                partition.map(async (a) => {
                    uploads.set(a.file.name, {
                        progress: 0,
                        abort: () => {
                            a.xhr.abort();
                        }
                    });
                    a.xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            const value = uploads.get(a.file.name);
                            if (!value) {
                                return;
                            }
                            uploads.set(a.file.name, {
                                ...value,
                                progress: (e.loaded / e.total) * 100
                            });
                        }
                    };
                    a.xhr.send(a.file);
                    const uploadAttempt = await a.promise;
                    return {
                        file: a.file,
                        key: a.key,
                        pendingUploadId: a.pendingUploadId,
                        attempt: uploadAttempt
                    };
                })
            );
            uploadResults.push(...results);
        }

        for (const result of uploadResults) {
            if (!result.attempt.ok) {
                toast({
                    type: 'negative',
                    body: `An error occurred while trying to upload file ${result.file.name} (code: ${result.attempt.error}).`
                });
                return;
            }
        }

        return uploadResults;
    };
</script>

<form
    method="post"
    action="?/create_resource"
    use:form
    use:enhance={async (e) => {
        form.validate();
        if (!form.isValid()) {
            e.cancel();
            return;
        }

        let uploadResults:
            | {
                  file: File;
                  key: string;
                  pendingUploadId: number;
                  attempt: Attempt<void, string>;
              }[]
            | null = null;
        if (files.size > 0) {
            uploadResults =
                (await uploadFiles(fields.workspaceId.state.value, Array.from(files.values()))) ??
                null;
            if (uploadResults) {
                let i = 0;
                for (const result of uploadResults.filter((a) => a.attempt.ok)) {
                    e.formData.set(`files.${i}.key`, result.key);
                    e.formData.set(`files.${i}.originalName`, result.file.name);
                    e.formData.set(`files.${i}.pendingUploadId`, result.pendingUploadId + '');
                    e.formData.set(`files.${i}.size`, result.file.size + '');
                    e.formData.set(`files.${i}.mimeType`, result.file.type);
                    ++i;
                }
            }
        }

        const content = toggle.value && editor ? editor.getHTML() : null;
        const previewContent = toggle.value && editor ? editor.getText().substring(0, 256) : null;
        if (content) {
            e.formData.set('content', content);
        }

        const old = resourceListRef.value;
        resourceListRef.value = paginatedList({
            items: [
                {
                    optimisticId: Date.now(),
                    resource: {
                        optimisticId: Date.now(),
                        name: fields.name.state.value,
                        createdTime: DateTime.now().toISO(),
                        document: previewContent ? { previewContent } : undefined,
                        previewFileCount: uploadResults?.length ?? 0,
                        previewFileMimeTypes: uploadResults?.map((a) => a.file.type) ?? [],
                        rank: '',
                        creator: user
                    }
                },
                ...(old?.items ?? [])
            ],
            totalCount: (old?.totalCount ?? 0) + 1
        });
        loading.set();
        return async ({ result, update }) => {
            loading.unset();
            if (result.type === 'success') {
                toast({
                    type: 'positive',
                    body: `Resource ${fields.name.state.value} created successfully.`
                });
            } else if (result.type === 'failure') {
                const validation = validateActionFailureData(result.data);
                if (!validation.ok) {
                    toast({
                        type: 'negative',
                        body: `An error occurred while trying to create the resource (code: ${result.status}).`
                    });
                    return;
                }
                form.setErrors(validation.data.errors);
                rootErrors = validation.data.errors.root ?? [];
                toast({
                    type: 'negative',
                    body: `An error occurred while trying to create the resource (code: ${stringifyActionFailureErrors(validation.data.errors)}).`
                });
                resourceListRef.value = old;
            }
            await update();
        };
    }}
>
    <div class="flex items-center justify-between gap-2">
        <h2 class="capitalize">Create resource</h2>
        <IconResourcePlus class="text-base-fg-1 size-10" />
    </div>
    <p class="c-label mb-4">
        Create a new resource with docs and files to share within your workspace.
    </p>
    <input
        type="hidden"
        name={fields.workspaceId.state.name}
        value={fields.workspaceId.state.value}
    />
    <Field class="mb-4">
        <Label for="name">Name</Label>
        <Input
            type="text"
            id="name"
            name={fields.name.state.name}
            bind:value={fields.name.state.value}
            required
            action={fields.name}
        />
        <Errors errors={fields.name.state.errors} />
    </Field>
    <div class="mb-4">
        <Field>
            <div class="mb-2 flex items-center justify-between gap-2">
                <Label for="include-documentation">Include documentation</Label>
                <button
                    id="include-documentation"
                    type="button"
                    {...toggle.trigger}
                    class="bg-base-5 hover:bg-base-hover active:bg-base-active data-[checked]:bg-primary-1 group relative h-7 w-14 rounded-full transition"
                >
                    <div
                        class="bg-base-1 dark:bg-base-fg-5 group-data-[checked]:bg-primary-fg-1 absolute left-0.5 top-1/2 size-6 -translate-y-1/2 rounded-full shadow-sm transition group-data-[checked]:translate-x-7"
                    ></div>
                </button>
            </div>
            {#if toggle.value}
                <div>
                    <TiptapEditor
                        bind:editor
                        editorProps={{
                            attributes: {
                                class: 'h-64 overflow-auto'
                            }
                        }}
                        content={fields.content.state.value}
                        onBlur={() => {
                            if (!dirty.isDirty) {
                                return;
                            }
                            fields.content.setErrors(fields.content.validate());
                        }}
                        onTransaction={(e) => {
                            if (dirty.isDirty || !e.transaction.docChanged) {
                                return;
                            }
                            dirty.set();
                        }}
                        onCreate={() => {
                            if (!dirty.isDirty) {
                                return;
                            }
                            fields.content.state.errors = fields.content.validate();
                        }}
                    />
                    <Errors errors={fields.content.state.errors} />
                </div>
            {/if}
        </Field>
    </div>
    <div class="mb-4">
        <CreateResourceFileUpload {files} {uploads} />
    </div>
    <Button
        type="submit"
        variant="primary"
        class="flex items-center justify-center gap-2 capitalize"
        disabled={loading.immediate || !form.isValid()}
    >
        <LoadingMonitor {loading} class="size-5">
            {#snippet children()}
                <IconPlus class="size-full" />
            {/snippet}
        </LoadingMonitor>
        Create resource
    </Button>
    {#if rootErrors.length > 0}
        <Errors errors={rootErrors} class="mt-2"></Errors>
    {/if}
</form>
