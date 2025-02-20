import * as Bun from 'bun';

const icons = {
    Home: '~icons/ph/house-bold',
    HomeSolid: '~icons/ph/house-fill',
    Users: '~icons/heroicons/user-group',
    UsersSolid: '~icons/heroicons/user-group-16-solid',
    Plus: '~icons/heroicons/plus-16-solid',
    XMark: '~icons/heroicons/x-mark-16-solid',
    ChevronLeft: '~icons/heroicons/chevron-left-16-solid',
    ChevronRight: '~icons/heroicons/chevron-right-16-solid',
    ArrowUp: '~icons/heroicons/arrow-up-16-solid',
    ArrowDown: '~icons/heroicons/arrow-down-16-solid',
    ArrowsUpDown: '~icons/heroicons/arrows-up-down-16-solid',
    H1: '~icons/lucide/heading-1',
    H2: '~icons/lucide/heading-2',
    H3: '~icons/lucide/heading-3',
    H4: '~icons/lucide/heading-4',
    H5: '~icons/lucide/heading-5',
    H6: '~icons/lucide/heading-6',
    Bold: '~icons/lucide/bold',
    Italic: '~icons/lucide/italic',
    StrikeThrough: '~icons/lucide/strikethrough',
    Underline: '~icons/lucide/underline',
    Quotes: '~icons/lucide/quote',
    Issues: '~icons/ph/files-fill',
    IssuesOutline: '~icons/ph/files',
    SettingsOutline: '~icons/heroicons/cog-6-tooth',
    Settings: '~icons/heroicons/cog-6-tooth-16-solid',
    Check: '~icons/heroicons/check-16-solid',
    UserPlus: '~icons/heroicons/user-plus-16-solid',
    Search: '~icons/heroicons/magnifying-glass-16-solid',
    Trash: '~icons/heroicons/trash-16-solid',
    ChevronUpDown: '~icons/heroicons/chevron-up-down-16-solid',
    Rows: '~icons/lucide/rows-3',
    Columns: '~icons/lucide/columns-3',
    Draggable: '~icons/lucide/grip-vertical',
    ChevronUp: '~icons/heroicons/chevron-up-16-solid',
    ChevronDown: '~icons/heroicons/chevron-down-16-solid',
    CircleDashedOutline: '~icons/ph/circle-dashed',
    CircleDashed: '~icons/ph/circle-dashed-fill',
    Google: '~icons/custom/google',
    ProjectOutline: '~icons/ph/cube',
    Project: '~icons/ph/cube-fill',
    PriorityNone: '~icons/ph/cell-signal-none-fill',
    PriorityLow: '~icons/ph/cell-signal-low-fill',
    PriorityMedium: '~icons/ph/cell-signal-medium-fill',
    PriorityHigh: '~icons/ph/cell-signal-high-fill',
    PriorityUrgent: '~icons/ph/warning-fill',
    Backlog: '~icons/ph/circle-dashed',
    Todo: '~icons/ph/circle',
    InProgress: '~icons/ph/circle-half',
    Done: '~icons/ph/check-circle-fill',
    Canceled: '~icons/ph/x-circle',
    Duplicated: '~icons/ph/x-circle',
    Upload: '~icons/heroicons/cloud-arrow-up-16-solid',
    UploadOutline: '~icons/heroicons/cloud-arrow-up',
    Minus: '~icons/heroicons/minus-16-solid',
    Edit: '~icons/heroicons/pencil-16-solid',
    Link: '~icons/heroicons/link-16-solid',
    ArrowRight: '~icons/heroicons/arrow-right-16-solid',
    Success: '~icons/heroicons/check-circle-16-solid',
    Failure: '~icons/heroicons/exclamation-circle-16-solid'
};

await Promise.all([
    //     ...Object.entries(icons).map(([k, v]) =>
    //         Bun.write(
    //             `Icon${k}.svelte`,
    //             `<script lang="ts">
    //     import type { SVGAttributes } from 'svelte/elements';
    //     import Icon from '${v}';

    //     const { ...props }: SVGAttributes<SVGElement> = $props();
    // </script>

    // <Icon {...props} />
    // `
    //         )
    //     ),
    Bun.write(
        `index.ts`,
        Object.entries(icons)
            .map(([k, v]) => `export { default as Icon${k} } from '${v}';`)
            .join('\n') + '\n'
    )
]);
