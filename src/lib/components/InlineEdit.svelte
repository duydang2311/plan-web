<script lang="ts">
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';
    import clsx from 'clsx';
    import { type Snippet } from 'svelte';
    import type { HTMLInputAttributes, SVGAttributes } from 'svelte/elements';
    import { IconButton } from '.';
    import { watch } from '../utils/runes.svelte';
    import { IconCheck, IconEditOutline, IconXMark } from './icons';
    import Input from './Input.svelte';

    let {
        editing = $bindable(false),
        name,
        action,
        value,
        onSubmit,
        inputProps,
        iconProps,
        children
    }: {
        editing?: boolean;
        name: string;
        action: string;
        value: string;
        onSubmit: SubmitFunction;
        inputProps?: Omit<HTMLInputAttributes, 'size'>;
        iconProps?: SVGAttributes<SVGElement>;
        children: Snippet;
    } = $props();

    const { class: inputClass, ...inputRestProps } = $derived(inputProps ?? {});
    const { class: iconClass, ...iconRestProps } = $derived(iconProps ?? {});
    let ref = $state.raw<HTMLDivElement>();
    let ignoreKeyUp = false;
    let ignoreFocus = true;

    watch(() => editing)(() => {
        if (!editing) {
            if (ignoreFocus) {
                ignoreFocus = false;
            } else {
                ref?.focus();
            }
        }
    });
</script>

{#if editing}
    <form
        method="post"
        {action}
        use:enhance={(e) => {
            ignoreFocus = true;
            editing = false;
            ignoreKeyUp = true;
            if (e.formData.get('name') === value) {
                e.cancel();
                return;
            }
            return onSubmit(e);
        }}
        class="relative flex items-center gap-2"
    >
        <Input
            type="text"
            {name}
            {value}
            class={clsx(
                'rounded-none border-0 border-b bg-transparent p-0 pr-16 focus:ring-0',
                inputClass
            )}
            onkeydown={(e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                } else if (e.key === 'Enter') {
                    e.stopPropagation();
                }
            }}
            onkeyup={(e) => {
                if (e.key === 'Escape') {
                    editing = false;
                }
            }}
            action={(node) => {
                node.focus();
            }}
            {...inputRestProps}
        />
        <div class="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <IconButton
                type="button"
                variant="base"
                onclick={() => {
                    ignoreFocus = true;
                    editing = false;
                }}
            >
                <IconXMark />
            </IconButton>
            <IconButton type="submit" variant="primary">
                <IconCheck />
            </IconButton>
        </div>
    </form>
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
            if (ignoreKeyUp) {
                ignoreKeyUp = false;
                return;
            }
            if (!editing && (e.key === 'Enter' || e.key === ' ')) {
                editing = true;
            }
        }}
        class="hover:border-b-base-border-1 focus:border-b-base-border-1 group relative flex cursor-default items-baseline justify-between gap-2 rounded-none border-b border-b-transparent focus:outline-none"
    >
        <div>
            {@render children()}
        </div>
        <IconButton
            type="button"
            onclick={() => {
                if (!editing) {
                    editing = true;
                }
            }}
        >
            <IconEditOutline
                {...iconRestProps}
                class={clsx(
                    'in-focus:opacity-100 opacity-0 transition group-hover:opacity-100',
                    iconClass
                )}
            />
        </IconButton>
    </div>
{/if}
