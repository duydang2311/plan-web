<script lang="ts" module>
    const progressClass = {
        base: 'bg-base-fg-1',
        positive: 'bg-positive-1',
        negative: 'bg-negative-1'
    };
</script>

<script lang="ts">
    import { onMount } from 'svelte';

    import { IconXMark } from './icons';
    import { add, remove, type ToastProps } from './Sonner.svelte';

    const {
        type,
        header,
        headerProps,
        body,
        bodyProps,
        footer,
        footerProps,
        onDismiss,
        durationMs = 5000
    }: ToastProps<unknown, unknown, unknown> = $props();
    let progress = $state.raw(0);

    onMount(() => {
        const id = add({
            get progress() {
                return progress;
            },
            set progress(value) {
                progress = value;
            },
            now: performance.now(),
            durationMs
        });
        return () => {
            remove(id);
        };
    });
</script>

{#snippet headerSnippet()}
    {#if header}
        <div>
            {#if typeof header === 'function'}
                {@render header(headerProps)}
            {:else}
                <h2 class="text-h6 font-semibold">
                    {header}
                </h2>
            {/if}
        </div>
    {/if}
{/snippet}

{#snippet bodySnippet()}
    {#if body}
        <div>
            {#if typeof body === 'function'}
                {@render body(bodyProps)}
            {:else}
                <span>
                    {body}
                </span>
            {/if}
        </div>
    {/if}
{/snippet}

{#snippet footerSnippet()}
    {#if footer}
        <div class="c-text-secondary text-sm">
            {#if typeof footer === 'function'}
                {@render footer(footerProps)}
            {:else}
                <span>
                    {footer}
                </span>
            {/if}
        </div>
    {/if}
{/snippet}

<div
    class={[
        'bg-base-1 dark:bg-base-2 w-(--width) border-base-border-3 shadow-xs relative overflow-hidden rounded-lg border p-4 focus:outline-none font-body'
    ]}
>
    <div class="flex items-start gap-4">
        <div class="grow space-y-2 text-pretty">
            {@render headerSnippet()}
            {@render bodySnippet()}
            {@render footerSnippet()}
        </div>
        <button
            type="button"
            onclick={onDismiss}
            class={[
                'text-base-fg-ghost hover:text-base-fg-1 active:text-base-fg-3 transition',
                'group-[[data-expanded=false][data-front=false]]:hidden'
            ]}
        >
            <IconXMark />
        </button>
    </div>
    <div
        class={['absolute inset-x-0 bottom-0 h-[2px]', progressClass[type ?? 'base']]}
        style="transform: translateX(calc({progress * 100 - 100}%));"
    ></div>
</div>
