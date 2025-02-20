<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { Avatar, OptionalLink, RelativeTime } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import type { LocalIssueAudit } from './+page.server';

    interface Props {
        audit: LocalIssueAudit;
    }
    const { audit }: Props = $props();
    const { cloudinary } = useRuntime();
</script>

<div class="flex items-center gap-2">
    <OptionalLink href={audit.user.profile ? `/profiles/${audit.user.profile.name}` : undefined}>
        <Avatar
            seed={audit.user.profile?.name ?? audit.user.email}
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
        created the issue
        <span class="text-base-fg-4">
            · <RelativeTime time={audit.createdTime} />
        </span>
    </div>
</div>
