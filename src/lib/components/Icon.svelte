<script lang="ts" module>
    const imports = {
        home: () => import('~icons/ph/house-bold'),
        'home-solid': () => import('~icons/ph/house-fill'),
        users: () => import('~icons/heroicons/user-group'),
        'users-solid': () => import('~icons/heroicons/user-group-20-solid'),
        plus: () => import('~icons/heroicons/plus-20-solid'),
        'x-mark': () => import('~icons/heroicons/x-mark-20-solid'),
        'chevron-left': () => import('~icons/heroicons/chevron-left-20-solid'),
        'chevron-right': () => import('~icons/heroicons/chevron-right-20-solid'),
        'arrow-up': () => import('~icons/heroicons/arrow-up-20-solid'),
        'arrow-down': () => import('~icons/heroicons/arrow-down-20-solid'),
        'arrows-up-down': () => import('~icons/heroicons/arrows-up-down-20-solid'),
        h1: () => import('~icons/lucide/heading-1'),
        h2: () => import('~icons/lucide/heading-2'),
        h3: () => import('~icons/lucide/heading-3'),
        h4: () => import('~icons/lucide/heading-4'),
        h5: () => import('~icons/lucide/heading-5'),
        h6: () => import('~icons/lucide/heading-6'),
        bold: () => import('~icons/lucide/bold'),
        italic: () => import('~icons/lucide/italic'),
        'strike-through': () => import('~icons/lucide/strikethrough'),
        underline: () => import('~icons/lucide/underline'),
        quotes: () => import('~icons/lucide/quote'),
        issues: () => import('~icons/ph/files-fill'),
        'issues-outline': () => import('~icons/ph/files'),
        'settings-outline': () => import('~icons/heroicons/cog-6-tooth'),
        settings: () => import('~icons/heroicons/cog-6-tooth-20-solid'),
        check: () => import('~icons/heroicons/check-20-solid'),
        'user-plus': () => import('~icons/heroicons/user-plus-20-solid'),
        search: () => import('~icons/heroicons/magnifying-glass-20-solid'),
        trash: () => import('~icons/heroicons/trash-20-solid'),
        'chevron-up-down': () => import('~icons/heroicons/chevron-up-down-20-solid'),
        rows: () => import('~icons/lucide/rows-3'),
        columns: () => import('~icons/lucide/columns-3'),
        draggable: () => import('~icons/lucide/grip-vertical'),
        'chevron-up': () => import('~icons/heroicons/chevron-up-20-solid'),
        'chevron-down': () => import('~icons/heroicons/chevron-down-20-solid'),
        'circle-dashed-outline': () => import('~icons/ph/circle-dashed'),
        'circle-dashed': () => import('~icons/ph/circle-dashed-fill'),
        google: () => import('~icons/custom/google'),
        'project-outline': () => import('~icons/ph/cube'),
        project: () => import('~icons/ph/cube-fill')
    };

    export type IconName = keyof typeof imports;

    const loaded = writable<{
        [k in keyof typeof imports]?: typeof import('~icons/*').default;
    }>({});

    const loading: {
        [k in keyof typeof imports]?: boolean;
    } = {};
</script>

<script lang="ts">
    import type { SVGAttributes } from 'svelte/elements';
    import { writable } from 'svelte/store';

    interface Props extends SVGAttributes<SVGElement> {
        name: IconName;
    }

    const { name, ...props }: Props = $props();
    const Icon = $derived($loaded[name]);

    if (!$loaded[name] && !loading[name]) {
        loading[name] = true;
        imports[name]()
            .then((a) => {
                $loaded[name] = a.default;
            })
            .finally(() => {
                loading[name] = false;
            });
    }
</script>

{#if Icon}
    <Icon {...props} />
{/if}
