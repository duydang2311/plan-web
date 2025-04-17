<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { redirect } from '@sveltejs/kit';
    import { Button, LoadingMonitor, toast } from '~/lib/components';
    import { IconBack, IconCheck, IconXMark } from '~/lib/components/icons';
    import { createLoading } from '~/lib/utils/runes.svelte';
    import type { PageData, SubmitFunction } from './$types';

    const { data }: { data: PageData } = $props();

    const submitLoading = createLoading();
    const declineLoading = createLoading();
    const submitAccept: SubmitFunction = () => {
        submitLoading.set();
        return async ({ result }) => {
            submitLoading.unset();
            if (result.type === 'redirect') {
                toast({
                    type: 'positive',
                    body: acceptSuccess,
                    bodyProps: data.invitation.project.name
                });
                await goto(result.location, { invalidateAll: true });
            } else if (result.type === 'failure') {
                toast({
                    type: 'negative',
                    body: 'The server responded with an error while trying to accept the invitation.'
                });
            }
        };
    };
    const submitDecline: SubmitFunction = () => {
        declineLoading.set();
        return async ({ result }) => {
            declineLoading.unset();
            if (result.type === 'redirect') {
                toast({
                    type: 'positive',
                    body: declineSuccess,
                    bodyProps: data.invitation.project.name
                });
                await goto(result.location, { invalidateAll: true });
            } else if (result.type === 'failure') {
                toast({
                    type: 'negative',
                    body: 'The server responded with an error while trying to decline the invitation.'
                });
            }
        };
    };
    const submitting = $derived(submitLoading.immediate || declineLoading.immediate);
</script>

{#snippet acceptSuccess(projectName: string)}
    You have joined the project <strong>{projectName}</strong> successfully.
{/snippet}

{#snippet declineSuccess(projectName: string)}
    Invitation to the project <strong>{projectName}</strong> has been declined.
{/snippet}

<main class="min-h-screen content-center p-4">
    <div class="max-w-paragraph-lg mx-auto text-center">
        <h1>
            Invited to <strong>{data.invitation.project.name}</strong>
        </h1>
        <p class="text-pretty">
            By clicking on <strong>Accept</strong>, you will join the project
            <strong>{data.invitation.project.name}</strong> as a
            <strong>{data.invitation.role.name}</strong>.
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-2">
            <Button
                as="link"
                href="/"
                variant="base"
                class="mx-auto flex w-fit items-center gap-2"
                filled={false}
            >
                <IconBack />
                Back to home
            </Button>
            <div class="mx-auto flex w-fit gap-4">
                <form method="post" action="?/decline" use:enhance={submitDecline}>
                    <input
                        type="hidden"
                        name="projectMemberInvitationId"
                        value={data.invitation.id}
                    />
                    <Button
                        variant="negative"
                        filled={false}
                        type="submit"
                        class="flex items-center gap-2"
                        disabled={submitting}
                    >
                        <LoadingMonitor loading={declineLoading} class="size-5">
                            <IconXMark />
                        </LoadingMonitor>
                        Decline
                    </Button>
                </form>
                <form method="post" action="?/accept" use:enhance={submitAccept}>
                    <input
                        type="hidden"
                        name="projectMemberInvitationId"
                        value={data.invitation.id}
                    />
                    <Button
                        variant="primary"
                        type="submit"
                        class="flex items-center gap-2"
                        disabled={submitting}
                    >
                        <LoadingMonitor loading={submitLoading} class="size-5">
                            <IconCheck />
                        </LoadingMonitor>
                        Accept
                    </Button>
                </form>
            </div>
        </div>
    </div>
</main>
