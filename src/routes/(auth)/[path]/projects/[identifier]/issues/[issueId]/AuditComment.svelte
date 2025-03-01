<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { Resize } from '@cloudinary/url-gen/actions';
    import { Editor } from '@tiptap/core';
    import DOMPurify from 'isomorphic-dompurify';
    import { Avatar, OptionalLink, RelativeTime } from '~/lib/components';
    import Button from '~/lib/components/Button.svelte';
    import { IconCheck, IconXMark } from '~/lib/components/icons';
    import Tiptap from '~/lib/components/Tiptap.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import type { LocalIssueAudit } from './+page.server';
    import AuditCommentActions from './AuditCommentActions.svelte';

    interface Props {
        audit: LocalIssueAudit;
        currentUserId: string;
        ref: Ref<PaginatedList<LocalIssueAudit> | undefined>;
    }

    let editing = $state(false);
    let editor = $state.raw<Editor>();
    const { audit, currentUserId, ref }: Props = $props();
    const { cloudinary } = useRuntime();
    const data = $derived(audit.data as { content: string });
    const isAuthor = $derived(audit.user.id === currentUserId);
</script>

<div class="border-base-border-3 dark:bg-base-3 shadow-xs -mx-4 rounded-lg border p-4">
    <div class="flex items-center gap-2">
        <OptionalLink
            href={audit.user.profile ? `/profiles/${audit.user.profile.name}` : undefined}
        >
            <Avatar
                seed={audit.user.email}
                src={imageFromAsset(cloudinary)(audit.user.profile?.image)
                    ?.resize(Resize.fill(64))
                    .toURL()}
                class="size-8"
            />
        </OptionalLink>
        <div class="text-sm">
            <OptionalLink
                href={audit.user.profile ? `/profiles/${audit.user.profile.name}` : undefined}
            >
                <span class="font-bold">
                    {audit.user.profile?.displayName ?? audit.user.email}
                </span>
            </OptionalLink>
            added a comment
            <span class="text-base-fg-4"> · <RelativeTime time={audit.createdTime} /></span>
        </div>
        {#if isAuthor}
            <div class="ml-auto">
                <AuditCommentActions {ref} auditId={audit.id} bind:editing />
            </div>
        {/if}
    </div>
    <div class="mt-2">
        {#if editing}
            <form
                method="post"
                action="?/edit_comment"
                class="relative"
                use:enhance={async (e) => {
                    if (!editor) {
                        e.cancel();
                        return;
                    }
                    const html = editor.getHTML();
                    e.formData.set('content', html);
                    editing = false;
                    const old = ref.value;
                    if (old) {
                        console.log('before', ref.value);
                        ref.value = paginatedList({
                            items: old.items.map((a) =>
                                a.id === audit.id ? { ...a, data: { content: html } } : a
                            ),
                            totalCount: old.totalCount
                        });
                        console.log('after', ref.value);
                    }
                    return async ({ result }) => {
                        if (result.type === 'failure') {
                            ref.value = old;
                        }
                        await invalidateAll();
                    };
                }}
            >
                <input type="hidden" name="id" value={audit.id} />
                <Tiptap
                    bind:editor
                    name="content"
                    content={data.content}
                    editorProps={{ class: 'pb-8' }}
                />
                <div class="absolute bottom-2 right-2 flex gap-2">
                    <Button
                        type="button"
                        variant="base"
                        size="sm"
                        onclick={() => {
                            editing = false;
                        }}
                        class="flex w-fit items-center gap-2"
                    >
                        <IconXMark />
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        class="flex w-fit items-center gap-2"
                    >
                        <IconCheck />
                        Save
                    </Button>
                </div>
            </form>
        {:else}
            <div class="prose max-w-full">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html DOMPurify.sanitize(data.content, { USE_PROFILES: { html: true } })}
            </div>
        {/if}
    </div>
</div>
