<script lang="ts">
    import { Icon } from '~/lib/components';
    import Button from '~/lib/components/Button.svelte';

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
    class="flex gap-2 items-center bg-base-3"
    onclick={onClick}
>
    <Icon name="edit" />
    Edit
</Button>
