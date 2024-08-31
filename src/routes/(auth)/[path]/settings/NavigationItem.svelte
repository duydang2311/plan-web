<script lang="ts">
    import clsx from 'clsx';

    interface Props {
        label: string;
        href: string;
        isActive: boolean;
    }

    const { label, href, isActive }: Props = $props();
</script>

<a
    {href}
    class={clsx(
        'relative z-10 block py-1 px-4 transition-[font-weight_color]',
        isActive ? 'text-base-fg-1 font-bold bg-base-3' : 'hover:bg-base-3'
    )}
>
    {label}
</a>
