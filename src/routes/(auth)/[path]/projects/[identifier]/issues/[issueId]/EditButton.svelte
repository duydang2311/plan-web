<script lang="ts">
    import Button from '~/lib/components/Button.svelte';
    import { IconEdit } from '~/lib/components/icons';

    interface Props {
        editing: boolean;
        onClick: () => void;
    }

    const { editing, onClick }: Props = $props();
</script>

<Button
    variant="base"
    size="sm"
    disabled={editing}
    class="flex items-center gap-2"
    onclick={onClick}
>
    <IconEdit />
    Edit
</Button>
