<script lang="ts">
    import { page } from '$app/state';
    import { Button } from '~/lib/components';
    import { IconBack } from '~/lib/components/icons';
</script>

<svelte:head>
    <title>Error - {page.status} ({page.error?.code})</title>
</svelte:head>

<main class="min-h-screen content-center">
    {#if page.error}
        <div class="max-w-paragraph-lg mx-auto text-center">
            <h1 class="text-9xl font-black">{page.status}</h1>
            <p class="text-base-fg-ghost">Oops, something went wrong!</p>
            <pre class="mx-auto mt-4 w-fit text-left">{JSON.stringify(
                    page.error,
                    null,
                    4
                )}
            </pre>
            <Button
                as="link"
                href="/"
                variant="primary"
                class="mx-auto mt-16 flex w-fit items-center gap-2"
            >
                <IconBack />
                Back to home
            </Button>
        </div>
    {/if}
</main>
