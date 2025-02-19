<li class="flex min-w-96 flex-col rounded-lg p-4 transition duration-75">
    <div class="bg-base-4 h-8 w-60"></div>
    <div class="scrollbar-3 grow overflow-y-auto overflow-x-hidden pt-2">
        <ol class="h-full space-y-4">
            {#each { length: 4 } as _}
                <li class="bg-base-2 h-24 w-full rounded-md"></li>
            {/each}
        </ol>
    </div>
</li>
