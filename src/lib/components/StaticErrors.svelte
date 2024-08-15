<script lang="ts">
    import clsx from 'clsx';

    interface Props {
        errors?: string[];
        errorMap?: Record<string, string>;
        class?: string;
    }

    const { errors = [], errorMap, ...props }: Props = $props();
</script>

<ol
    class={clsx(
        'm-0 p-0 text-negative-1 text-sm font-medium list-none',
        errors.length === 1 ? 'list-none' : 'list-inside',
        props.class
    )}
>
    {#each errors as error}
        {@const message = errorMap?.[error] ?? error}
        <li><em>{message}{!message.endsWith('.') ? '.' : undefined}</em></li>
    {/each}
</ol>
