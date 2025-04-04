<script lang="ts">
    import type { Editor } from '@tiptap/core';
    import { Button } from '..';
    import {
        IconBold,
        IconCodeBracket,
        IconCodeBracketSquareOutline,
        IconItalic,
        IconStrikeThrough
    } from '../icons';

    const { editor }: { editor: Editor } = $props();
</script>

{#snippet btn(name: string, Icon: SvelteIconComponent, onclick: () => void)}
    <Button
        type="button"
        variant="base"
        {onclick}
        class={[
            'p-2',
            editor.isActive(name)
                ? 'bg-base-hover text-base-fg-1'
                : 'dark:bg-base-4 dark:hover:bg-base-5 dark:active:bg-base-active'
        ]}
    >
        <Icon />
    </Button>
{/snippet}

<div class="flex rounded *:rounded-none *:first:rounded-l *:last:rounded-r">
    {#if !editor.isActive('code') && !editor.isActive('codeBlock')}
        {@render btn('bold', IconBold, () => {
            editor.chain().focus().toggleBold().run();
        })}
        {@render btn('italic', IconItalic, () => {
            editor.chain().focus().toggleItalic().run();
        })}
        {@render btn('strike', IconStrikeThrough, () => {
            editor.chain().focus().toggleStrike().run();
        })}
    {/if}
    {#if !editor.isActive('codeBlock')}
        {@render btn('code', IconCodeBracket, () => {
            editor.chain().focus().toggleCode().run();
        })}
    {/if}
    {@render btn('codeBlock', IconCodeBracketSquareOutline, () => {
        editor.chain().focus().toggleCodeBlock().run();
    })}
</div>
