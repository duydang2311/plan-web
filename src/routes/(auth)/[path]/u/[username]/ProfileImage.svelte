<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import { FileUpload } from 'melt/builders';
    import { toStore } from 'svelte/store';
    import { Avatar, Spinner2, toast } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { errorCodes } from '~/lib/models/errors';
    import type { UserProfileSignedUpload } from '~/lib/models/user';
    import { createLoading } from '~/lib/utils/runes.svelte';
    import { attempt } from '~/lib/utils/try';
    import CropDialog from '~/routes/(auth)/(basic)/profiles/[profileName]/CropDialog.svelte';
    import type { LocalUser } from './+page.server';

    const { user, isCurrentUser }: { user: LocalUser; isCurrentUser: boolean } = $props();
    const { api } = useRuntime();
    let file = $state.raw<File>();
    const fileUpload = new FileUpload({
        accept: 'image/*',
        maxSize: 4 * 1024 * 1024,
        selected: () => file,
        onSelectedChange: async (f) => {
            if (f) {
                file = f;
            }
        },
        disabled: () => loading.immediate
    });
    const loading = createLoading();

    const updateProfileImage = async (blob: Blob) => {
        const createSignedUploadAttempt = await attempt.promise(() =>
            api.post('users/profiles/signed-upload')
        )(errorCodes.fromFetch);

        if (createSignedUploadAttempt.failed || !createSignedUploadAttempt.data.ok) {
            toast({
                type: 'negative',
                body: 'Something went wrong while creating a signed upload URL.',
                footer: `Error code: ${createSignedUploadAttempt.failed ? createSignedUploadAttempt.error : createSignedUploadAttempt.data.status}.`
            });
            return;
        }

        const signedUploadJsonAttempt = await attempt.promise(() =>
            createSignedUploadAttempt.data.json<UserProfileSignedUpload>()
        )(errorCodes.fromJson);
        if (signedUploadJsonAttempt.failed) {
            toast({
                type: 'negative',
                body: 'Something went wrong while creating a signed upload URL.',
                footer: `Error code: ${signedUploadJsonAttempt.error}.`
            });
            return;
        }

        const { url, ...body } = signedUploadJsonAttempt.data;
        const formData = new FormData();
        formData.set('timestamp', body.timestamp + '');
        formData.set('public_id', body.publicId);
        formData.set('api_key', body.apiKey);
        formData.set('transformation', body.transformation);
        formData.set('signature', body.signature);
        formData.set('notification_url', body.notificationUrl);
        formData.set('file', blob);

        const uploadAttempt = await attempt.promise(() =>
            fetch(url, { method: 'post', body: formData })
        )(errorCodes.fromFetch);
        if (uploadAttempt.failed || !uploadAttempt.data.ok) {
            toast({
                type: 'negative',
                body: 'Something went wrong while uploading your image.',
                footer: `Error code: ${uploadAttempt.failed ? uploadAttempt.error : uploadAttempt.data.status}.`
            });
            return;
        }

        const uploadJsonAttempt = await attempt.promise(() =>
            uploadAttempt.data.json<{
                resource_type: string;
                format: string;
                public_id: string;
                version: number;
            }>()
        )(errorCodes.fromJson);
        if (uploadJsonAttempt.failed) {
            toast({
                type: 'negative',
                body: 'Something went wrong while uploading your image.',
                footer: `Error code: ${uploadJsonAttempt.error}.`
            });
            return;
        }

        const patchAttempt = await attempt.promise(() =>
            api.patch(`user-profiles/${user.id}`, {
                body: {
                    patch: {
                        imageResourceType: uploadJsonAttempt.data.resource_type,
                        imageFormat: uploadJsonAttempt.data.format,
                        imagePublicId: uploadJsonAttempt.data.public_id,
                        imageVersion: uploadJsonAttempt.data.version
                    }
                }
            })
        )(errorCodes.fromFetch);

        if (patchAttempt.failed || !patchAttempt.data.ok) {
            toast({
                type: 'negative',
                body: 'Something went wrong while updating your profile image.',
                footer: `Error code: ${patchAttempt.failed ? patchAttempt.error : patchAttempt.data.status}.`
            });
            return;
        }

        toast({
            type: 'positive',
            body: 'Profile image uploaded successfully.'
        });
        await invalidateAll();
    };
</script>

{#if isCurrentUser}
    <input {...fileUpload.input} />
    <div {...fileUpload.dropzone} class="group relative mx-auto max-w-80 rounded-full">
        <Avatar size={512} {user} />
        {#if loading.immediate}
            <div
                class="absolute inset-0 select-none content-center rounded-full bg-black/40 text-center"
            >
                <Spinner2
                    class="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-white/40"
                />
            </div>
        {:else}
            <div
                data-dragging={fileUpload.isDragging ? true : undefined}
                class="absolute inset-0 select-none content-center rounded-full bg-black/60 text-center text-white/80 opacity-0 transition group-hover:opacity-100 data-[dragging]:opacity-100"
            >
                {#if fileUpload.isDragging}
                    <strong>Drop</strong> your image here
                {:else}
                    Click to <strong>upload</strong> or <strong>drag and drop</strong>
                {/if}
            </div>
        {/if}
    </div>
{:else}
    <Avatar size={512} {user} class="mx-auto max-w-80" />
{/if}

<!-- TODO: make this a component in lib -->
<CropDialog
    options={{
        open: toStore(
            () => file != null,
            (a) => {
                if (!a) {
                    file = undefined;
                }
            }
        ),
        forceVisible: true
    }}
    file={file ?? null}
    onFinish={async (blob) => {
        file = undefined;
        loading.set();
        await updateProfileImage(blob).finally(() => {
            loading.unset();
        });
    }}
/>
