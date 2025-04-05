<script lang="ts">
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import type { Editor } from '@tiptap/core';
    import { writable } from 'svelte/store';
    import { Button, SelectBuilder } from '~/lib/components';
    import {
        IconCheck,
        IconTextAlignCenter,
        IconTextAlignJustify,
        IconTextAlignLeft,
        IconTextAlignRight
    } from '~/lib/components/icons';
    import { watch } from '~/lib/utils/runes.svelte';

    const { editor }: { editor: Editor } = $props();

    const options = [
        {
            label: 'Left',
            value: 'left',
            icon: IconTextAlignLeft,
            onSelect: () => {
                editor.chain().focus().setTextAlign('left').run();
            }
        },
        {
            label: 'Center',
            value: 'center',
            icon: IconTextAlignCenter,
            onSelect: () => {
                editor.chain().focus().setTextAlign('center').run();
            }
        },
        {
            label: 'Right',
            value: 'right',
            icon: IconTextAlignRight,
            onSelect: () => {
                editor.chain().focus().setTextAlign('right').run();
            }
        },
        {
            label: 'Justify',
            value: 'justify',
            icon: IconTextAlignJustify,
            onSelect: () => {
                editor.chain().focus().setTextAlign('justify').run();
            }
        }
    ];

    const getTextAlign = () => {
        return editor.isActive('paragraph')
            ? ((editor.getAttributes('paragraph').textAlign as string) ?? 'left')
            : editor.isActive('heading')
              ? ((editor.getAttributes('heading').textAlign as string) ?? 'left')
              : null;
    };

    const initialTextAlign = getTextAlign();
    const selected = writable<SelectOption<string>>(
        options.find((a) => a.value === initialTextAlign) ?? options[0]
    );
    const open = writable(false);
    const selectedOption = $derived(
        $selected ? options.find((a) => a.value === $selected.value) : null
    );

    watch(() => editor)(() => {
        const textAlign = getTextAlign();
        $selected = options.find((a) => a.value === textAlign) || options[0];
    });
</script>

<SelectBuilder
    options={{
        open,
        selected,
        forceVisible: true,
        positioning: {
            placement: 'bottom-start',
            sameWidth: false
        }
    }}
>
    {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
        <Button
            variant="base"
            melt={trigger}
            class="dark:bg-base-4 dark:hover:bg-base-hover dark:active:bg-base-active dark:data-[custom-state=open]:bg-base-hover w-fit p-2"
            data-custom-state={$open ? 'open' : 'closed'}
        >
            {#if selectedOption}
                <selectedOption.icon />
            {/if}
        </Button>
        {#if $open}
            <div class="c-select--menu w-fit" use:melt={menu}>
                {#each options as o (o.value)}
                    {@const opt = option(o)}
                    <button
                        type="button"
                        class="c-select--option gap-2"
                        onclick={() => {
                            o.onSelect();
                        }}
                        use:melt={opt}
                    >
                        {#if isSelected(o.value)}
                            <IconCheck class="c-select--check" />
                        {/if}
                        <o.icon />
                        {o.label}
                    </button>
                {/each}
            </div>
        {/if}
    {/snippet}
</SelectBuilder>
