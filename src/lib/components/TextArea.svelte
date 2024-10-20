<script lang="ts">
    import clsx from 'clsx';
    import type { HTMLTextareaAttributes } from 'svelte/elements';
    import Errors from './Errors.svelte';

    interface Props extends Exclude<HTMLTextareaAttributes, 'children'> {
        errors?: string[];
    }

    let { value = $bindable(), errors, ...props }: Props = $props();
</script>

<textarea
    aria-invalid={value && errors?.length ? true : undefined}
    {...props}
    bind:value
    class={clsx('c-input', props.class)}
></textarea>
<Errors errors={value ? errors : undefined} />
