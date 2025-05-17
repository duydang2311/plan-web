<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button, LoadingMonitor, toast } from '~/lib/components';
    import { IconBack, IconCheck, IconXMark } from '~/lib/components/icons';
    import {
        stringifyActionFailureErrors,
        validateActionFailureData
    } from '~/lib/utils/kit.client';
    import { createLoading, createRef } from '~/lib/utils/runes.svelte';
    import type { PageData, SubmitFunction } from './$types';

    const { data }: { data: PageData } = $props();

    const submitLoading = createLoading();
    const declineLoading = createLoading();
    const submitAccept: SubmitFunction = (e) => {
        if (getInvitationRef.value == null || !getInvitationRef.value.ok) {
            e.cancel();
            return;
        }

        const data = getInvitationRef.value.data;
        submitLoading.set();
        return async ({ result, update }) => {
            submitLoading.unset();
            if (result.type === 'redirect') {
                toast({
                    type: 'positive',
                    body: acceptSuccess,
                    bodyProps: data.workspace.name
                });
                await update();
            } else if (result.type === 'failure') {
                const validation = validateActionFailureData(result.data);
                toast({
                    type: 'negative',
                    body: 'Something went wrong while trying to accept the invitation.',
                    footer: stringifyActionFailureErrors(
                        validation.ok ? validation.data.errors : validation.errors
                    )
                });
            }
        };
    };
    const submitDecline: SubmitFunction = (e) => {
        if (getInvitationRef.value == null || !getInvitationRef.value.ok) {
            e.cancel();
            return;
        }

        const data = getInvitationRef.value.data;
        declineLoading.set();
        return async ({ result, update }) => {
            declineLoading.unset();
            if (result.type === 'redirect') {
                toast({
                    type: 'positive',
                    body: declineSuccess,
                    bodyProps: data.workspace.name
                });
                await update();
            } else if (result.type === 'failure') {
                const validation = validateActionFailureData(result.data);
                toast({
                    type: 'negative',
                    body: 'Something went wrong while trying to decline the invitation.',
                    footer: stringifyActionFailureErrors(
                        validation.ok ? validation.data.errors : validation.errors
                    )
                });
            }
        };
    };
    const submitting = $derived(submitLoading.immediate || declineLoading.immediate);
    const getInvitationRef = createRef.maybePromise(() => data.getInvitation);
</script>

{#snippet acceptSuccess(name: string)}
    You have joined the workspace <strong>{name}</strong> successfully.
{/snippet}

{#snippet declineSuccess(name: string)}
    Invitation to the workspace <strong>{name}</strong> has been declined.
{/snippet}

<main class="min-h-screen content-center p-4">
    {#if getInvitationRef.value == null && getInvitationRef.loading.immediate}
        Loading...
    {:else if getInvitationRef.value == null}
        Invitation not found.
    {:else if !getInvitationRef.value.ok}
        {JSON.stringify(getInvitationRef.value.error)}
    {:else}
        <div class="max-w-paragraph-lg mx-auto text-center">
            <h1>
                Invited to <strong>{getInvitationRef.value.data.workspace.name}</strong>
            </h1>
            <p class="text-pretty">
                By clicking on <strong>Accept</strong>, you will join the workspace
                <strong>{getInvitationRef.value.data.workspace.name}</strong> as a
                <strong>Member</strong>.
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
                            name="workspaceInvitationId"
                            value={getInvitationRef.value.data.id}
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
                            name="workspaceInvitationId"
                            value={getInvitationRef.value.data.id}
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
    {/if}
</main>
