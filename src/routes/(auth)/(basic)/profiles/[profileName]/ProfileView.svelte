<script lang="ts">
    import { Avatar } from '~/lib/components';
    import type { LocalUser } from './+page.server';

    const { profile }: { profile: NonNullable<LocalUser['profile']> } = $props();
</script>

<main class="max-w-screen-lg mx-auto content-center p-8 h-screen">
    <div class="text-center">
        <Avatar
            alt={profile.name}
            src={profile.imageUrl}
            seed={profile.name}
            class="w-32 rounded-full"
        />
        <p class="font-bold text-base-fg-1">{profile.displayName}</p>
        <p class="text-base-fg-3">{profile.name}</p>
    </div>
</main>
