<script lang="ts">
    import clsx from 'clsx';
    import type { HTMLTextareaAttributes } from 'svelte/elements';
    import Errors from './Errors.svelte';
    import type { Action } from 'svelte/action';

    interface Props extends Exclude<HTMLTextareaAttributes, 'children'> {
        errors?: string[];
        useField?: Action;
    }

    let { value = $bindable(), useField, errors, ...props }: Props = $props();

    const fieldAction = $derived(useField ? useField : () => {});
</script>

<textarea
    aria-invalid={value && errors?.length ? true : undefined}
    {...props}
    bind:value
    class={clsx('c-input', props.class)}
    use:fieldAction
></textarea>
<Errors errors={value ? errors : undefined} />
