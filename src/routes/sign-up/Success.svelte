<script lang="ts">
	import Link from '~/lib/components/Link.svelte';

	const { email }: { email: string } = $props();
</script>

<h1>Email verification</h1>
<p>
	We've sent a verification link to your email - <Link href="mailto:{email}">{email}</Link>.
</p>
<p>Please check your mail inbox and proceed to verify your email with instruction.</p>
<hr class="mx-auto" />
<p>
	<Link href="/login">Back to login</Link>.
</p>
