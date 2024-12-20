<script lang="ts">
    import { melt } from '@melt-ui/svelte';
    import Cropper from 'svelte-easy-crop';
    import { fade } from 'svelte/transition';
    import { Button, DialogBuilder, type DialogProps } from '~/lib/components';
    import { dialog, tsap } from '~/lib/utils/transition';
    import { getCroppedImage } from './utils.client';

    interface CropArea {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    interface Props extends DialogProps {
        file: File | Blob | null;
        onFinish: (blob: Blob) => void;
    }

    const { file, onFinish, ...props }: Props = $props();
    let cropArea = $state.raw<CropArea>();
</script>

<DialogBuilder {...props}>
    {#snippet children({ overlay, content, close })}
        <div
            transition:fade={{ duration: 150 }}
            use:melt={overlay}
            class="fixed inset-0 bg-black/20"
        ></div>
        <div
            use:melt={content}
            in:tsap={dialog.in({ duration: 0.6 })}
            out:tsap={dialog.out()}
            class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-paragraph-lg focus:outline-none p-4"
        >
            <div class="bg-base-1 rounded-lg w-full space-y-4 border border-base-border-2 p-4">
                <div>
                    <p class="text-h4 font-medium text-base-fg-1">Edit profile picture</p>
                    <p class="text-base-fg-3">
                        You can resize and crop the image as you like before uploading.
                    </p>
                </div>
                <div
                    class="relative rounded overflow-hidden h-[32rem] bg-base-3 w-full border border-base-border-2"
                >
                    {#if file}
                        <Cropper
                            image={URL.createObjectURL(file)}
                            showGrid={false}
                            aspect={1}
                            maxZoom={4}
                            cropShape="round"
                            on:cropcomplete={(e) => {
                                cropArea = e.detail.pixels;
                            }}
                            zoomSpeed={0.25}
                        />
                    {/if}
                </div>
                <div class="flex gap-4 justify-end">
                    <Button type="button" variant="base" outline class="w-fit" melt={close}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        outline
                        class="w-fit"
                        onclick={async () => {
                            if (!file || !cropArea) {
                                return;
                            }

                            const croppedEither = await getCroppedImage(
                                URL.createObjectURL(file),
                                cropArea
                            )();

                            if (croppedEither.tag === 'Left') {
                                return;
                            }

                            onFinish(croppedEither.right);
                        }}
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </div>
    {/snippet}
</DialogBuilder>
