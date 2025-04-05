<script lang="ts">
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import type { Editor } from '@tiptap/core';
    import { writable } from 'svelte/store';
    import { Button, SelectBuilder } from '~/lib/components';
    import { IconCheck } from '~/lib/components/icons';
    import { watch } from '~/lib/utils/runes.svelte';

    const { editor }: { editor: Editor } = $props();

    const options = [
        {
            label: 'H1',
            value: 1,
            buttonLabel: 'Heading 1',
            onSelect: () => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
            }
        },
        {
            label: 'H2',
            value: 2,
            buttonLabel: 'Heading 2',
            onSelect: () => {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
            }
        },
        {
            label: 'H3',
            value: 3,
            buttonLabel: 'Heading 3',
            onSelect: () => {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
            }
        },
        {
            label: 'H4',
            value: 4,
            buttonLabel: 'Heading 4',
            onSelect: () => {
                editor.chain().focus().toggleHeading({ level: 4 }).run();
            }
        },
        {
            label: 'H5',
            value: 5,
            buttonLabel: 'Heading 5',
            onSelect: () => {
                editor.chain().focus().toggleHeading({ level: 5 }).run();
            }
        },
        {
            label: 'H6',
            value: 6,
            buttonLabel: 'Heading 6',
            onSelect: () => {
                editor.chain().focus().toggleHeading({ level: 6 }).run();
            }
        },
        {
            label: 'Paragraph',
            value: 0,
            buttonLabel: 'Paragraph',
            onSelect: () => {
                editor.chain().focus().setParagraph().run();
            }
        }
    ];

    const selected = writable<SelectOption<number>>(
        editor.getAttributes('heading')?.level
            ? options.find((a) => a.value === editor.getAttributes('heading').level)
            : options.find((a) => a.value === 0)
    );
    const open = writable(false);
    const selectedOption = $derived(
        $selected ? options.find((a) => a.value === $selected.value) : null
    );

    watch(() => editor)(() => {
        const level = editor.getAttributes('heading')?.level;
        $selected = options.find((a) => a.value === level) ?? options.find((a) => a.value === 0)!;
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
            class="dark:bg-base-4 dark:hover:bg-base-hover dark:active:bg-base-active dark:data-[custom-state=open]:bg-base-hover w-28 min-w-max leading-none"
            data-custom-state={$open ? 'open' : 'closed'}
        >
            {selectedOption?.buttonLabel ?? 'Paragraph'}
        </Button>
        {#if $open}
            <div class="c-select--menu w-fit" use:melt={menu}>
                {#each options as o (o.value)}
                    {@const opt = option(o)}
                    <button
                        type="button"
                        class="c-select--option"
                        onclick={() => {
                            o.onSelect();
                        }}
                        use:melt={opt}
                    >
                        {#if isSelected(o.value)}
                            <IconCheck class="c-select--check" />
                        {/if}
                        <span
                            class:text-h1={o.value === 1}
                            class:text-h2={o.value === 2}
                            class:text-h3={o.value === 3}
                            class:text-h4={o.value === 4}
                            class:text-h5={o.value === 5}
                            class:text-h6={o.value === 6}
                        >
                            {o.label}
                        </span>
                    </button>
                {/each}
            </div>
        {/if}
    {/snippet}
</SelectBuilder>
