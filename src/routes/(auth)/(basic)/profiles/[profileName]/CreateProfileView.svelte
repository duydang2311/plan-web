<script lang="ts">
    import { lorelei } from '@dicebear/collection';
    import { onMount } from 'svelte';
    import { Button, Field, Icon, Input, Label, TextArea } from '~/lib/components';

    let defaultSrc = $state.raw<string>();
    let imageFile = $state<File>();
    let createAvatar: (typeof import('@dicebear/core'))['createAvatar'] | undefined = undefined;

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

<main class="lg:max-w-paragraph-lg mx-auto grow content-center w-full">
    <p class="text-h6 font-medium mb-12 text-base-fg-ghost text-center">
        You don't have a profile yet!
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
    <form method="post" class="space-y-8 mt-8">
        <div class="flex gap-4">
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
                />
            </Field>
            <Field class="grow">
                <Label for="displayName">Display name</Label>
                <Input type="text" id="displayName" name="displayName" placeholder="John Smith" />
            </Field>
        </div>

        <fieldset class="space-y-4">
            <legend class="text-h4 text-base-fg-3">Optional information</legend>
            <Field class="w-full !mt-2">
                <Label for="imageUrl" class="max-w-full">
                    <p class="mb-1">Profile picture (optional)</p>
                    <div
                        class="c-input text-center p-4"
                        role="dialog"
                        ondrop={(e) => {
                            if (!e.dataTransfer) {
                                return;
                            }

                            let file: File | null | undefined = undefined;
                            file = [...e.dataTransfer.items]
                                .find((a) => a.kind === 'file' && a.type.startsWith('image'))
                                ?.getAsFile();
                            if (!file) {
                                file = [...e.dataTransfer.files].find((a) =>
                                    a.type.startsWith('image')
                                );
                            }
                            if (!file) {
                                return;
                            }

                            imageFile = file;
                            e.preventDefault();
                        }}
                        ondragover={(e) => {
                            if (!e.dataTransfer) {
                                return;
                            }
                            if (
                                ![...e.dataTransfer.items].find(
                                    (a) => a.kind === 'file' && a.type.startsWith('image')
                                )
                            ) {
                                if (
                                    ![...e.dataTransfer.files].find((a) =>
                                        a.type.startsWith('image')
                                    )
                                ) {
                                    return;
                                }
                            }
                            e.preventDefault();
                        }}
                    >
                        <Icon name="upload-outline" class="mx-auto size-8 text-base-fg-ghost" />
                        {#if imageFile}
                            <p>
                                {imageFile.name} ({Math.round(
                                    (imageFile.size / 1024 / 1024) * 100
                                ) / 100} MB)
                            </p>
                        {:else}
                            <p>Click to upload or drag and drop</p>
                            <p class="text-base-fg-ghost">
                                <small>.svg, .png, .jpg, .gif or any image file type</small>
                            </p>
                        {/if}
                    </div>
                </Label>
                <Input
                    type="file"
                    id="imageUrl"
                    name="imageUrl"
                    accept="image/*"
                    oninput={(e) => {
                        const files = e.currentTarget.files;
                        if (!files || files.length < 1) {
                            imageFile = undefined;
                            return;
                        }

                        imageFile = files[0];
                    }}
                    hidden
                />
            </Field>
            <Field class="w-full">
                <Label for="bio">Bio (optional)</Label>
                <TextArea
                    id="bio"
                    name="bio"
                    placeholder="Add your bio..."
                    rows={4}
                    class="resize-none"
                />
            </Field>
            <Field class="w-full">
                <Label for="bio">Social links (optional)</Label>
                <div class="space-y-4">
                    <Input type="text" id="socialLink" name="socialLink" placeholder="https://" />
                    <Input type="text" id="socialLink" name="socialLink" placeholder="https://" />
                </div>
            </Field>
        </fieldset>
        <div class="flex gap-4 justify-end">
            <Button type="reset" variant="base" outline class="w-fit">Reset</Button>
            <Button type="submit" variant="primary" outline class="w-fit">Create</Button>
        </div>
    </form>
</main>
