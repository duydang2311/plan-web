<script lang="ts">
    import { enhance } from '$app/forms';
    import { writable } from 'svelte/store';
    import {
        Avatar,
        Button,
        Errors,
        Field,
        IconButton,
        Input,
        Label,
        LoadingMonitor,
        TextArea,
        toast
    } from '~/lib/components';
    import {
        IconCheck,
        IconMinus,
        IconPlus,
        IconUploadOutline,
        IconXMark
    } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { errorCodes } from '~/lib/models/errors';
    import { createForm, formValidator, type HelperField } from '~/lib/utils/form.svelte';
    import { createLoading } from '~/lib/utils/runes.svelte';
    import { attempt } from '~/lib/utils/try';
    import CropDialog from './CropDialog.svelte';
    import ProfileImageFileField from './ProfileImageFileField.svelte';
    import { validateCreateProfile } from './utils';

    const { userId }: { userId: string } = $props();
    const { api } = useRuntime();
    let imageFile = $state<File | Blob | null>(null);
    let imageFileInfo = $state<{ name: string; bytes: number } | null>(null);
    let cropDialogOpen = writable(false);
    const form = createForm({
        validator: formValidator(validateCreateProfile)
    });
    const fields = $state({
        userId: form.createField({ name: 'userId', initialValue: userId }),
        name: form.createField({ name: 'name' }),
        displayName: form.createField({ name: 'displayName' }),
        bio: form.createField({ name: 'bio' })
    });
    const socialLinks = $state<HelperField[]>([]);
    const loading = createLoading();

    const upload = async (file: File | Blob) => {
        const createSignedUploadAttempt = await attempt.promise(() =>
            api.get('users/profiles/signed-upload')
        )(errorCodes.fromFetch);
        if (createSignedUploadAttempt.failed || !createSignedUploadAttempt.data.ok) {
            return createSignedUploadAttempt.failed
                ? createSignedUploadAttempt
                : attempt.fail(createSignedUploadAttempt.data.status + '');
        }

        const signedUploadJsonAttempt = await attempt.promise(() =>
            createSignedUploadAttempt.data.json<{
                url: string;
                timestamp: number;
                publicId: string;
                apiKey: string;
                transformation: string;
                signature: string;
                notificationUrl: string;
            }>()
        )(errorCodes.fromJson);
        if (signedUploadJsonAttempt.failed) {
            return signedUploadJsonAttempt;
        }

        const { url, ...body } = signedUploadJsonAttempt.data;
        const formData = new FormData();
        formData.set('timestamp', body.timestamp + '');
        formData.set('public_id', body.publicId);
        formData.set('api_key', body.apiKey);
        formData.set('transformation', body.transformation);
        formData.set('signature', body.signature);
        formData.set('notification_url', body.notificationUrl);
        formData.set('file', file);

        const uploadAttempt = await attempt.promise(() =>
            fetch(url, { method: 'post', body: formData })
        )(errorCodes.fromFetch);
        if (uploadAttempt.failed || !uploadAttempt.data.ok) {
            return uploadAttempt.failed
                ? uploadAttempt
                : attempt.fail(uploadAttempt.data.status + '');
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
            return uploadJsonAttempt;
        }

        return attempt.ok(uploadJsonAttempt.data);
    };
</script>

<div class="max-w-paragraph-lg mx-auto w-full grow content-center p-4">
    <div class="mx-auto flex w-fit items-center gap-8">
        <Avatar
            alt=""
            src={imageFile != null ? URL.createObjectURL(imageFile) : undefined}
            seed={fields.name.state.value}
            class="w-28"
        />
        <div class="text-pretty">
            <h1>Set up your profile</h1>
            <p class="text-base-fg-3">Create a profile to help people know more about you.</p>
        </div>
    </div>
    <form
        method="post"
        action="?/create_profile"
        enctype="multipart/form-data"
        class="mt-8 space-y-8"
        use:form
        use:enhance={async (e) => {
            form.validate();
            if (!form.isValid()) {
                e.cancel();
                return;
            }

            loading.set();
            if (imageFile) {
                const uploadAttempt = await upload(imageFile);
                if (uploadAttempt.failed) {
                    toast({
                        type: 'negative',
                        body: 'Something went wrong while uploading your profile image.',
                        footer: `Error code: ${uploadAttempt.error}.`
                    });
                    e.cancel();
                    return;
                }
                toast({
                    type: 'positive',
                    body: 'Profile image uploaded successfully.'
                });
                e.formData.set('image.publicId', uploadAttempt.data.public_id);
                e.formData.set('image.resourceType', uploadAttempt.data.resource_type);
                e.formData.set('image.format', uploadAttempt.data.format);
                e.formData.set('image.version', uploadAttempt.data.version.toString());
            }

            return async ({ update }) => {
                loading.unset();
                await update();
            };
        }}
    >
        <input
            type="hidden"
            hidden
            name={fields.userId.state.name}
            value={fields.userId.state.value}
        />
        <div class="flex flex-wrap gap-4">
            <Field class="grow">
                <Label for="name">User name</Label>
                <Input
                    useField={fields.name}
                    type="text"
                    id="name"
                    name={fields.name.state.name}
                    placeholder="john.smith123"
                    required
                    pattern="[A-Za-z0-9]+"
                    bind:value={fields.name.state.value}
                />
                <Errors errors={fields.name.state.errors} />
            </Field>
            <Field class="grow">
                <Label for="displayName">Display name</Label>
                <Input
                    useField={fields.displayName}
                    type="text"
                    id="displayName"
                    name={fields.displayName.state.name}
                    placeholder="John Smith"
                    required
                    pattern="[a-zA-Z\s]+"
                    bind:value={fields.displayName.state.value}
                />
                <Errors errors={fields.displayName.state.errors} />
            </Field>
        </div>

        <fieldset class="space-y-4">
            <legend class="text-h4 text-base-fg-3">Optional details</legend>
            <Field class="!mt-2 w-full">
                <ProfileImageFileField
                    onInput={(file) => {
                        if (file) {
                            imageFile = file;
                            imageFileInfo = { name: file.name, bytes: file.size };
                            $cropDialogOpen = true;
                        }
                    }}
                >
                    <IconUploadOutline class="text-base-fg-ghost mx-auto size-8" />
                    {#if imageFileInfo}
                        <p>
                            {imageFileInfo.name} ({Math.round(
                                (imageFileInfo.bytes / 1024 / 1024) * 100
                            ) / 100} MB)
                        </p>
                    {:else}
                        <p>Click to upload or drag and drop</p>
                        <p class="text-base-fg-ghost">
                            <small>.svg, .png, .jpg, .gif or any image file type</small>
                        </p>
                    {/if}
                </ProfileImageFileField>
                <CropDialog
                    options={{
                        open: cropDialogOpen,
                        closeOnOutsideClick: false,
                        escapeBehavior: 'ignore',
                        forceVisible: true
                    }}
                    file={imageFile}
                    onFinish={(blob) => {
                        $cropDialogOpen = false;
                        imageFile = blob;
                    }}
                />
            </Field>
            <Field class="w-full">
                <Label for="bio">Bio</Label>
                <TextArea
                    useField={fields.bio}
                    id="bio"
                    name="bio"
                    placeholder="Add your bio..."
                    rows={4}
                    class="resize-none"
                    bind:value={fields.bio.state.value}
                />
                <Errors errors={fields.bio.state.errors} />
            </Field>
            <fieldset class="w-full">
                <legend class="c-label mb-1 flex w-full items-center gap-2">
                    <span>Social links</span>
                    <IconButton
                        type="button"
                        onclick={() => {
                            socialLinks.push(form.createField({ name: 'socialLinks' }));
                        }}
                        title="Add social link"
                    >
                        <IconPlus />
                    </IconButton>
                </legend>
                <div class="space-y-2">
                    {#each socialLinks as socialLink, i}
                        <Field>
                            <div class="relative">
                                <Input
                                    useField={socialLink}
                                    type="text"
                                    id="socialLinks/{i}"
                                    name="socialLinks"
                                    placeholder="https://"
                                    class="pr-10"
                                    bind:value={socialLink.state.value}
                                    required
                                    pattern={'(?:https?|wss?|ftp)://(?:S+(?::S*)?@)?(?:(?!(?:10|127)(?:.d{1,3}){3})(?!(?:169.254|192.168)(?:.d{1,3}){2})(?!172.(?:1[6-9]|2d|3[0-1])(?:.d{1,3}){2})(?:[1-9]d?|1dd|2[01]d|22[0-3])(?:.(?:1?d{1,2}|2[0-4]d|25[0-5])){2}(?:.(?:[1-9]d?|1dd|2[0-4]d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::d{2,5})?(?:/[^s]*)?'}
                                />
                                <IconButton
                                    type="button"
                                    variant="negative"
                                    onclick={() => {
                                        socialLinks.splice(i, 1);
                                    }}
                                    class="absolute right-0 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                >
                                    <IconMinus />
                                </IconButton>
                            </div>
                            <Errors errors={socialLink.state.errors} />
                        </Field>
                    {/each}
                </div>
            </fieldset>
        </fieldset>
        <div class="flex justify-end gap-4">
            <Button type="reset" variant="base" outline class="flex w-fit items-center gap-2">
                <IconXMark />
                Reset
            </Button>
            <Button
                type="submit"
                variant="primary"
                class="flex w-fit items-center gap-2"
                disabled={loading.immediate}
            >
                <LoadingMonitor {loading} class="size-5">
                    <IconCheck />
                </LoadingMonitor>
                Create
            </Button>
        </div>
    </form>
</div>
