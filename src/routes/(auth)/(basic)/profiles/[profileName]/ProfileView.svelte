<script lang="ts">
    import { Avatar } from '~/lib/components';
    import type { LocalUser } from './+page.server';

    const { profile }: { profile: NonNullable<LocalUser['profile']> } = $props();
</script>

<div class="text-center h-full">
    <Avatar
        alt={profile.displayName}
        src={profile.imageUrl}
        seed={profile.name}
        class="mb-2 w-48 rounded-full mx-auto"
    />
    <h2 class="text-base-fg-1 font-bold">{profile.displayName}</h2>
    <p class="text-base-fg-3">{profile.name}</p>
</div>
