<script lang="ts" context="module">
	import Home from '~icons/ph/house-bold';
	import HomeSolid from '~icons/ph/house-fill';
	import UserGroup from '~icons/heroicons/user-group-solid';
	import UserGroupOutline from '~icons/heroicons/user-group';
	import Plus from '~icons/heroicons/plus-20-solid';
	import XMark from '~icons/heroicons/x-mark-20-solid';
	import ChevronLeft from '~icons/heroicons/chevron-left-20-solid';
	import ChevronRight from '~icons/heroicons/chevron-right-20-solid';
	import ArrowUp from '~icons/heroicons/arrow-up-20-solid';
	import ArrowDown from '~icons/heroicons/arrow-down-20-solid';
	import ArrowsUpDown from '~icons/heroicons/arrows-up-down-20-solid';
	import H1 from '~icons/lucide/heading-1';
	import H2 from '~icons/lucide/heading-2';
	import H3 from '~icons/lucide/heading-3';
	import H4 from '~icons/lucide/heading-4';
	import H5 from '~icons/lucide/heading-5';
	import H6 from '~icons/lucide/heading-6';
	import Bold from '~icons/lucide/bold';
	import Italic from '~icons/lucide/italic';
	import StrikeThrough from '~icons/lucide/strikethrough';
	import Underline from '~icons/lucide/underline';
	import Quotes from '~icons/lucide/quote';
	import Files from '~icons/ph/files-fill';
	import FilesOutline from '~icons/ph/files';

	export type IconName = keyof typeof icons;

	const icons = {
		home: Home,
		'home-solid': HomeSolid,
		users: UserGroupOutline,
		'users-solid': UserGroup,
		plus: Plus,
		'x-mark': XMark,
		'chevron-left': ChevronLeft,
		'chevron-right': ChevronRight,
		'arrow-up': ArrowUp,
		'arrow-down': ArrowDown,
		'arrows-up-down': ArrowsUpDown,
		h1: H1,
		h2: H2,
		h3: H3,
		h4: H4,
		h5: H5,
		h6: H6,
		bold: Bold,
		italic: Italic,
		'strike-through': StrikeThrough,
		underline: Underline,
		quotes: Quotes,
		issues: Files,
		'issues-outline': FilesOutline
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
