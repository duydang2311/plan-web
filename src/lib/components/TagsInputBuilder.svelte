<script lang="ts">
    import { createTagsInput, type CreateTagsInputProps } from '@melt-ui/svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet<
            [
                {
                    elements: {
                        root: Root;
                        input: Input;
                        tag: Tag;
                        deleteTrigger: DeleteTrigger;
                        edit: Edit;
                    };
                    helpers: {
                        addTag: typeof addTag;
                        isEditing: IsEditing;
                        isInputValid: typeof isInputValid;
                        isSelected: IsSelected;
                        removeTag: typeof removeTag;
                        updateTag: typeof updateTag;
                    };
                }
            ]
        >;
        options?: CreateTagsInputProps;
    }

    type Root = Parameters<Parameters<typeof root.subscribe>[0]>[0];
    type Input = Parameters<Parameters<typeof input.subscribe>[0]>[0];
    type Tag = Parameters<Parameters<typeof tag.subscribe>[0]>[0];
    type DeleteTrigger = Parameters<Parameters<typeof deleteTrigger.subscribe>[0]>[0];
    type Edit = Parameters<Parameters<typeof edit.subscribe>[0]>[0];
    type IsEditing = Parameters<Parameters<typeof isEditing.subscribe>[0]>[0];
    type IsSelected = Parameters<Parameters<typeof isSelected.subscribe>[0]>[0];

    const { children, options }: Props = $props();
    const {
        elements: { root, input, tag, deleteTrigger, edit },
        helpers: { addTag, isEditing, isInputValid, isSelected, removeTag, updateTag }
    } = $derived(createTagsInput(options));
</script>

{@render children?.({
    elements: {
        root: $root,
        input: $input,
        tag: $tag,
        deleteTrigger: $deleteTrigger,
        edit: $edit
    },
    helpers: {
        addTag: addTag,
        isEditing: $isEditing,
        isInputValid: isInputValid,
        isSelected: $isSelected,
        removeTag: removeTag,
        updateTag: updateTag
    }
})}
