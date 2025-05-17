<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { Avatar, OptionalLink, RelativeTime } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import type { LocalIssueAudit } from './+page.server';
    import { formatTimeUi } from '~/lib/utils/time';

    interface Props {
        audit: LocalIssueAudit;
    }
    const { audit }: Props = $props();
    const { cloudinary } = useRuntime();
</script>

<div class="flex items-center gap-4 text-sm">
    <OptionalLink href={audit.user.profile ? `/profiles/${audit.user.profile.name}` : undefined}>
        <Avatar
            seed={audit.user.profile?.name ?? audit.user.email}
            src={imageFromAsset(cloudinary)(audit.user.profile?.image)
                ?.resize(Resize.fill(64))
                .toURL()}
            class="size-10"
        />
    </OptionalLink>
    <div>
        <OptionalLink
            href={audit.user.profile ? `/profiles/${audit.user.profile.name}` : undefined}
        >
            <span class="font-medium">
                {audit.user.profile?.displayName ?? audit.user.email}
            </span>
        </OptionalLink>
        created the task
        <span class="text-base-fg-4 c-text-secondary text-sm">
            {formatTimeUi(audit.createdTime)}
        </span>
    </div>
</div>
