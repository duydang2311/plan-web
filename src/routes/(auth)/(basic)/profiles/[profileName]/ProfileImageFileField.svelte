<script lang="ts">
    import type { Snippet } from 'svelte';
    import { Label } from '~/lib/components';
    import { createField } from '~/lib/utils/form.svelte';

    interface Props {
        onInput: (file?: File) => void;
        children: Snippet;
    }

    const { onInput, children }: Props = $props();
    const field = createField();
</script>

<input
    use:field
    type="file"
    id="imageUrl"
    name="imageUrl"
    accept="image/*"
    oninput={(e) => {
        const files = e.currentTarget.files;
        onInput(files?.[0]);
        e.currentTarget.value = '';
        return false;
    }}
    class="c-input--file opacity-0 w-0 h-0 absolute"
/>

<Label for="imageUrl" class="max-w-full">
    <p class="mb-1">Profile picture</p>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="c-input text-center p-4"
        ondrop={(e) => {
            if (!e.dataTransfer) {
                return;
            }

            let file: File | null | undefined = undefined;
            file = [...e.dataTransfer.items]
                .find((a) => a.kind === 'file' && a.type.startsWith('image'))
                ?.getAsFile();
            if (!file) {
                file = [...e.dataTransfer.files].find((a) => a.type.startsWith('image'));
            }
            onInput(file);
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
                if (![...e.dataTransfer.files].find((a) => a.type.startsWith('image'))) {
                    return;
                }
            }
            e.preventDefault();
        }}
    >
        {@render children()}
    </div>
</Label>
