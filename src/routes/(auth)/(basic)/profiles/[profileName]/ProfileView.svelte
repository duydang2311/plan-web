<script lang="ts">
    import type { LocalUser } from './+page.server';

    const { user }: { user: LocalUser } = $props();
</script>

<img alt="" src={user.profile?.imageUrl} class="max-w-64 rounded-full" />
