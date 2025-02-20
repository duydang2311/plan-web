<script lang="ts">
    import { enhance } from '$app/forms';
    import { pipe } from '@baetheus/fun/fn';
    import { useQueryClient } from '@tanstack/svelte-query';
    import { writable } from 'svelte/store';
    import {
        addToast,
        Avatar,
        Button,
        Errors,
        Field,
        IconButton,
        Input,
        Label,
        TextArea
    } from '~/lib/components';
    import { IconMinus, IconPlus, IconUploadOutline } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { createForm, formValidator, type HelperField } from '~/lib/utils/form.svelte';
    import { TE } from '~/lib/utils/functional';
    import CropDialog from './CropDialog.svelte';
    import ProfileImageFileField from './ProfileImageFileField.svelte';
    import { validateCreateProfile } from './utils';

    const { queryKey, userId }: { queryKey: unknown[]; userId: string } = $props();
    const { api } = useRuntime();
    const queryClient = useQueryClient();
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

    const upload = async (file: File | Blob) => {
        const either = await pipe(
            TE.fromPromise(() => api.get('users/profiles/signed-upload'))(),
            TE.flatMap((a) =>
                a.ok
                    ? TE.fromPromise(() =>
                          a.json<{
                              url: string;
                              timestamp: number;
                              publicId: string;
                              apiKey: string;
                              transformation: string;
                              signature: string;
                              notificationUrl: string;
                          }>()
                      )()
                    : TE.leftVoid
            )
        )();

        if (either.tag === 'Left') {
            addToast({
                data: {
                    title: 'Profile image failed to upload',
                    description: errorDescription1
                }
            });
            return;
        }

        const { url, ...body } = either.right;
        const formData = new FormData();
        formData.set('timestamp', body.timestamp + '');
        formData.set('public_id', body.publicId);
        formData.set('api_key', body.apiKey);
        formData.set('transformation', body.transformation);
        formData.set('signature', body.signature);
        formData.set('notification_url', body.notificationUrl);
        formData.set('file', file);

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
            addToast({
                data: {
                    title: 'Profile image failed to upload',
                    description: errorDescription2
                }
            });
            return;
        }

        addToast({
            data: {
                title: 'Profile image uploaded',
                description: 'It often takes us a few seconds to update your profile image.'
            }
        });
    };
</script>

{#snippet errorDescription(text: string)}
    <p>{text}</p>
    <p class="text-base-fg-ghost mt-2 text-sm">
        If the problem still persists, please try again without a profile image.
    </p>
{/snippet}

{#snippet errorDescription1()}
    {@render errorDescription('We could not request a profile image upload from the server.')}
{/snippet}

{#snippet errorDescription2()}
    {@render errorDescription('An error occurred while uploading your profile image.')}
{/snippet}

<main class="lg:max-w-paragraph-lg mx-auto w-full grow content-center">
    <p class="text-h6 text-base-fg-ghost mb-12 text-center">
        It seems like you don't have a profile yet!
    </p>
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
        action="?/create-profile"
        enctype="multipart/form-data"
        class="mt-8 space-y-8"
        use:form
        use:enhance={async (e) => {
            form.validate();
            if (!form.isValid()) {
                e.cancel();
                return;
            }

            if (imageFile) {
                upload(imageFile);
            }

            return async ({ update }) => {
                await update({ reset: true, invalidateAll: false });
                await queryClient.invalidateQueries({ queryKey });
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
            <Button type="reset" variant="base" outline class="w-fit">Reset</Button>
            <Button type="submit" variant="primary" outline class="w-fit">Create</Button>
        </div>
    </form>
</main>
