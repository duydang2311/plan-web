<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { DateTime } from 'luxon';
    import { Avatar, Link, OptionalLink } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { createIssueQuery } from './utils';

    interface Props {
        issueId: string;
    }

    const { issueId }: Props = $props();
    const { cloudinary } = useRuntime();
    const query = createIssueQuery(() => ({ issueId }));
    const issue = $derived($query.data);
</script>

{#if issue}
    <div class="flex items-center gap-2 mt-4 px-4">
        <OptionalLink
            href={issue.author.profile ? `/profiles/${issue.author.profile.name}` : undefined}
        >
            <Avatar
                seed={issue.author.profile?.name ?? issue.author.email}
                src={imageFromAsset(cloudinary)(issue.author.profile?.image)
                    ?.resize(Resize.fill(32))
                    .toURL()}
                class="size-8"
            />
        </OptionalLink>
        <div class="text-sm">
            <OptionalLink
                href={issue.author.profile ? `/profiles/${issue.author.profile.name}` : undefined}
            >
                <span class="font-bold font-display">
                    {issue.author.profile?.displayName ?? issue.author.email}
                </span>
            </OptionalLink>
            created the issue
            <span class="text-base-fg-4">
                · {DateTime.fromISO(issue.createdTime).toRelative()}
            </span>
        </div>
    </div>
{/if}
