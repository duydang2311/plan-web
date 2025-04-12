<script lang="ts">
    import { type Snippet } from 'svelte';
    import { watch } from '../utils/runes.svelte';

    let {
        editing = $bindable(false),
        children
    }: {
        editing?: boolean;
        children: Snippet<[{ editing: boolean; suppressNextKeyUp: () => void }]>;
    } = $props();

    let ref = $state.raw<HTMLDivElement>();
    let nextKeyUpSuppressed = false;

    const suppressNextKeyUp = () => {
        nextKeyUpSuppressed = true;
    };

    watch(() => editing)(() => {
        if (!editing) {
            ref?.focus();
        }
    });
</script>

{#if editing}
    {@render children({
        get editing() {
            return editing;
        },
        suppressNextKeyUp
    })}
{:else}
    <div
        bind:this={ref}
        tabindex={0}
        role="button"
        ondblclick={() => {
            if (!editing) {
                editing = true;
            }
        }}
        onkeydown={(e) => {
            if (!editing && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
            }
        }}
        onkeyup={(e) => {
            if (nextKeyUpSuppressed) {
                nextKeyUpSuppressed = false;
                return;
            }
            if (!editing && (e.key === 'Enter' || e.key === ' ')) {
                editing = true;
            }
        }}
    >
        {@render children({
            get editing() {
                return editing;
            },
            suppressNextKeyUp
        })}
    </div>
{/if}
