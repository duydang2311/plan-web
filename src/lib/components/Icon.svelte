<script lang="ts" context="module">
	import Home from '~icons/ph/house-bold';
	import HomeSolid from '~icons/ph/house-fill';
	import UserGroup from '~icons/heroicons/user-group-solid';
	import UserGroupOutline from '~icons/heroicons/user-group';
	import Plus from '~icons/heroicons/plus-20-solid';
	import XMark from '~icons/heroicons/x-mark-20-solid';
	import ChevronRight from '~icons/heroicons/chevron-right-20-solid';
	import ArrowUp from '~icons/heroicons/arrow-up-20-solid';
	import ArrowDown from '~icons/heroicons/arrow-down-20-solid';
	import ArrowsUpDown from '~icons/heroicons/arrows-up-down-20-solid';

	export type IconName = keyof typeof icons;

	const icons = {
		home: Home,
		'home-solid': HomeSolid,
		users: UserGroupOutline,
		'users-solid': UserGroup,
		plus: Plus,
		'x-mark': XMark,
		'chevron-right': ChevronRight,
		'arrow-up': ArrowUp,
		'arrow-down': ArrowDown,
		'arrows-up-down': ArrowsUpDown
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
