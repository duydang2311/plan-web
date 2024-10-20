<script lang="ts">
    import { enhance } from '$app/forms';
    import { pipe } from '@baetheus/fun/fn';
    import { lorelei } from '@dicebear/collection';
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { addToast, Button, Field, Icon, Input, Label, TextArea } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { Asset } from '~/lib/models/asset';
    import { TE } from '~/lib/utils/functional';
    import type { ValidationResult } from '~/lib/utils/validation';
    import CropDialog from './CropDialog.svelte';
    import ProfileImageFileField from './ProfileImageFileField.svelte';
    import { decodeCreateProfile, validateCreateProfile } from './utils';

    const { userId }: { userId: string } = $props();
    const { httpClient } = useRuntime();
    let defaultSrc = $state.raw<string>();
    let imageFile = $state<File | Blob | null>(null);
    let imageFileInfo = $state<{ name: string; bytes: number } | null>(null);
    let validation = $state<ValidationResult>();
    let createAvatar: (typeof import('@dicebear/core'))['createAvatar'] | undefined = undefined;
    let cropDialogOpen = writable(false);
    let imageAsset: Asset | null = null;
    const errors = $derived(validation != null && !validation.ok ? validation.errors : {});

    onMount(() => {
        import('@dicebear/core').then(({ createAvatar: _createAvatar }) => {
            createAvatar = _createAvatar;
            defaultSrc = createAvatarDataUri('');
        });
    });

    const createAvatarDataUri = (seed: string) =>
        createAvatar?.(lorelei, {
            seed,
            hairColor: ['fca201', '1770ff', '090909', 'f0442e', '6add1f'],
            scale: 120,
            translateY: 5
        }).toDataUri();
</script>

{#snippet errorDescription(text: string)}
    <p>{text}</p>
    <p class="text-base-fg-ghost mt-2 text-sm">
        If the problem still persists, please try again without a profile picture.
    </p>
{/snippet}

{#snippet errorDescription1()}
    {@render errorDescription('We could not request a profile picture upload from the server.')}
{/snippet}

{#snippet errorDescription2()}
    {@render errorDescription('An error occurred while uploading your profile picture.')}
{/snippet}

{JSON.stringify(validation)}
<main class="lg:max-w-paragraph-lg mx-auto grow content-center w-full">
    <p class="text-h6 mb-12 text-base-fg-ghost text-center">
        It seems like you don't have a profile yet!
    </p>
    <div class="flex gap-8 items-center mx-auto w-fit">
        <img
            src={imageFile != null ? URL.createObjectURL(imageFile) : defaultSrc}
            class="rounded-full aspect-square object-cover max-w-full h-28 border border-base-fg-2 bg-base-1"
            alt="profile"
        />
        <div class="text-pretty">
            <h1>Set up your profile</h1>
            <p class="text-base-fg-3">Create a profile to help people know more about you.</p>
        </div>
    </div>
    <form
        method="post"
        action="?/create-profile"
        enctype="multipart/form-data"
        class="space-y-8 mt-8"
        use:enhance={async (e) => {
            if (imageFile && !imageAsset) {
                const either = await pipe(
                    TE.fromPromise(() =>
                        httpClient.get('/api/users/profiles/image-signed-upload')
                    )(),
                    TE.flatMap((a) =>
                        a.ok
                            ? TE.fromPromise(() =>
                                  a.json<{
                                      url: string;
                                      timestamp: number;
                                      public_id: string;
                                      api_key: string;
                                      transformation: string;
                                      signature: string;
                                  }>()
                              )()
                            : TE.leftVoid
                    )
                )();

                if (either.tag === 'Left') {
                    e.cancel();
                    addToast({
                        data: {
                            title: 'Profile picture failed to upload',
                            description: errorDescription1
                        }
                    });
                    return;
                }

                const { url, ...body } = either.right;
                const formData = new FormData();
                formData.set('timestamp', body.timestamp + '');
                formData.set('public_id', body.public_id);
                formData.set('api_key', body.api_key);
                formData.set('transformation', body.transformation);
                formData.set('signature', body.signature);
                formData.set('file', imageFile);

                const uploadEither = await pipe(
                    TE.fromPromise(() => fetch(url, { method: 'post', body: formData }))(),
                    TE.flatMap((a) =>
                        a.ok
                            ? TE.fromPromise(() =>
                                  a.json<{
                                      resource_type: string;
                                      format: string;
                                      public_id: string;
                                      version: number;
                                  }>()
                              )()
                            : TE.leftVoid
                    )
                )();
                if (uploadEither.tag === 'Left') {
                    e.cancel();
                    addToast({
                        data: {
                            title: 'Profile picture failed to upload',
                            description: errorDescription2
                        }
                    });
                    return;
                }

                imageAsset = {
                    publicId: uploadEither.right.public_id,
                    resourceType: uploadEither.right.resource_type,
                    format: uploadEither.right.format,
                    version: uploadEither.right.version
                };
            }

            if (imageAsset) {
                e.formData.set('image.publicId', imageAsset.publicId);
                e.formData.set('image.resourceType', imageAsset.resourceType);
                e.formData.set('image.format', imageAsset.format);
                e.formData.set('image.version', imageAsset.version + '');
            }
        }}
        oninput={(e) => {
            const target = e.target as HTMLInputElement;
            if (!target?.ariaInvalid) {
                return;
            }
            validation = validateCreateProfile(decodeCreateProfile(new FormData(e.currentTarget)));
        }}
        onchange={(e) => {
            validation = validateCreateProfile(decodeCreateProfile(new FormData(e.currentTarget)));
        }}
    >
        <input type="hidden" hidden name="userId" value={userId} />
        <div class="flex flex-wrap gap-4">
            <Field class="grow">
                <Label for="name">User name</Label>
                <Input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="john.smith123"
                    oninput={(e) => {
                        if (!createAvatar || imageFile) {
                            return;
                        }
                        defaultSrc = createAvatarDataUri(e.currentTarget.value);
                    }}
                    errors={errors['name']}
                />
            </Field>
            <Field class="grow">
                <Label for="displayName">Display name</Label>
                <Input
                    type="text"
                    id="displayName"
                    name="displayName"
                    placeholder="John Smith"
                    errors={errors['displayName']}
                />
                <!-- <Errors errors={errors['displayName']} /> -->
            </Field>
        </div>

        <fieldset class="space-y-4">
            <legend class="text-h4 text-base-fg-3">Optional details</legend>
            <Field class="w-full !mt-2">
                <ProfileImageFileField
                    onInput={(file) => {
                        if (file) {
                            imageFile = file;
                            imageFileInfo = { name: file.name, bytes: file.size };
                            imageAsset = null;
                            $cropDialogOpen = true;
                        }
                    }}
                >
                    <Icon name="upload-outline" class="mx-auto size-8 text-base-fg-ghost" />
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
                    id="bio"
                    name="bio"
                    placeholder="Add your bio..."
                    rows={4}
                    class="resize-none"
                    errors={errors['bio']}
                />
            </Field>
            <Field class="w-full">
                <Label for="socialLink">Social links</Label>
                <div class="space-y-4">
                    <Field>
                        <Input
                            type="text"
                            id="socialLinks/0"
                            name="socialLinks"
                            placeholder="https://"
                            errors={errors['socialLinks/0']}
                        />
                    </Field>
                </div>
            </Field>
        </fieldset>
        <div class="flex gap-4 justify-end">
            <Button type="reset" variant="base" outline class="w-fit">Reset</Button>
            <Button type="submit" variant="primary" outline class="w-fit">Create</Button>
        </div>
    </form>
</main>
