<script lang="ts" context="module">
	import Home from '~icons/heroicons/home';
	import HomeSolid from '~icons/heroicons/home-solid';
	import UserGroup from '~icons/heroicons/user-group-solid';
	import UserGroupOutline from '~icons/heroicons/user-group';

	export type IconName = keyof typeof icons;

	const icons = {
		home: Home,
		'home-solid': HomeSolid,
		'user-group': UserGroup,
		'user-group-outline': UserGroupOutline
	} as const;
</script>

<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';

	interface Props extends SVGAttributes<SVGElement> {
		name: IconName;
	}

	const { name, ...props }: Props = $props();
</script>

<svelte:component this={icons[name]} {...props} />
<!-- {#await icons[name]().then((v) => v.default) then icon}
	<svelte:component this={icon} {...props} />
{/await} -->
