<script lang="ts">
    import BoardSkeleton from './BoardSkeleton.svelte';
</script>

<ol class="flex w-full animate-pulse overflow-x-auto overflow-y-hidden">
    {#each { length: 6 } as _}
        <li>
            <ol class="flex h-full w-fit gap-4 p-4">
                <BoardSkeleton />
            </ol>
        </li>
    {/each}
</ol>
