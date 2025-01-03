<script lang="ts">
    import { Avatar, OptionalLink } from '~/lib/components';
    import type { LocalIssueAudit } from './+page.server';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { Resize } from '@cloudinary/url-gen/actions';
    import { DateTime } from 'luxon';

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
                ?.resize(Resize.fill(32))
                .toURL()}
            class="size-8"
        />
    </OptionalLink>
    <div class="text-sm">
        <OptionalLink
            href={audit.user.profile ? `/profiles/${audit.user.profile.name}` : undefined}
        >
            <span class="font-bold font-display">
                {audit.user.profile?.displayName ?? audit.user.email}
            </span>
        </OptionalLink>
        created the issue
        <span class="text-base-fg-4">
            · {DateTime.fromISO(audit.createdTime).toRelative()}
        </span>
    </div>
</div>
