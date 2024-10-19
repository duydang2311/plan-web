<script lang="ts">
    import clsx from 'clsx';
    import { tsap } from '../utils/transition';

    interface Props {
        errors?: string[];
        errorMap?: Record<string, string>;
        class?: string;
    }

    const { errors = [], errorMap, ...props }: Props = $props();
</script>

{#if errors.length > 0}
    <div
        in:tsap={(node, gsap) =>
            gsap.from(node, {
                height: 0,
                overflow: 'hidden',
                clearProps: 'overflow, height',
                duration: 0.15,
                ease: 'circ.out'
            })}
        out:tsap={(node, gsap) =>
            gsap.to(node, {
                height: 0,
                overflow: 'hidden',
                duration: 0.15,
                ease: 'circ.in'
            })}
    >
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
    </div>
{/if}
