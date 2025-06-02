<script lang="ts">
    import twemoji from '@twemoji/api';
    import type { Milestone } from '~/lib/models/milestone';

    const { milestone }: { milestone: Pick<Milestone, 'title' | 'emoji' | 'color'> } = $props();
</script>

<div class="col-span-full grid grid-cols-subgrid items-center gap-2 text-nowrap">
    <div class="size-5">
        {@html twemoji.parse(milestone.emoji)}
    </div>
    <span>{milestone.title}</span>
</div>