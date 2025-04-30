<script lang="ts">
    import { Popover } from 'melt/builders';
    import { Button, IconButton } from '~/lib/components';
    import { IconDownloadOutline, IconMenu, IconTrash } from '~/lib/components/icons';
    import { popover, tsap } from '~/lib/utils/transition';

    const {
        canDelete,
        onDelete,
        onDownload
    }: { canDelete: boolean; onDelete: () => void; onDownload: () => void } = $props();

    const builder = new Popover({
        forceVisible: true
    });
</script>

<IconButton variant="base" {...builder.trigger}>
    <IconMenu />
</IconButton>

{#if builder.open}
    <div
        {...builder.content}
        in:tsap={popover.in}
        out:tsap={popover.out}
        class="c-popover--wrapper"
    >
        <div {...builder.arrow} class="c-popover--arrow"></div>
        <div class="c-popover p-1">
            <ul>
                <li>
                    <Button
                        filled={false}
                        variant="base"
                        size="sm"
                        class="flex w-full items-center gap-4"
                        onclick={onDownload}
                    >
                        <IconDownloadOutline />
                        <span>Download</span>
                    </Button>
                </li>
                {#if canDelete}
                    <li>
                        <Button
                            filled={false}
                            variant="negative"
                            size="sm"
                            class="flex w-full items-center gap-4"
                            onclick={onDelete}
                        >
                            <IconTrash />
                            <span>Delete</span>
                        </Button>
                    </li>
                {/if}
            </ul>
        </div>
    </div>
{/if}
