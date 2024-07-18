<script lang="ts">
	import { browser } from '$app/environment';
	import { Editor } from '@tiptap/core';
	import Placeholder from '@tiptap/extension-placeholder';
	import Underline from '@tiptap/extension-underline';
	import StarterKit from '@tiptap/starter-kit';
	import clsx from 'clsx';
	import { gsap } from 'gsap';
	import Flip from 'gsap/dist/Flip';
	import { onMount, tick } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';
	import TiptapButton from './TiptapButton.svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		editor?: Editor;
		placeholder?: string;
	}

	let { editor = $bindable(), placeholder, ...props }: Props = $props();

	let element = $state<HTMLDivElement>();
	let editors = $state.frozen<[Editor]>();
	let toolbar = $state<HTMLElement>();

	if (browser) {
		gsap.registerPlugin(Flip);
	}

	$effect(() => {
		editor = editors?.[0];
	});

	onMount(() => {
		const state = Flip.getState(toolbar!, { simple: true });
		editors = [
			new Editor({
				element,
				editorProps: {
					attributes: {
						class: 'prose max-w-none min-h-full focus:outline-none'
					}
				},
				extensions: [
					StarterKit,
					Placeholder.configure({
						placeholder
					}),
					Underline
				],
				onTransaction: () => {
					editors = [editors![0]];
				}
			})
		];

		tick().then(() => {
			Flip.from(state, {
				targets: toolbar,
				duration: 0.2,
				ease: 'power1.inOut'
			});
		});

		return () => {
			editors![0].destroy();
		};
	});
</script>

<div {...props} class="w-full border border-base-border rounded-md h-full">
	<div
		class="bg-base-2 border-b border-b-base-border px-4 py-1 rounded-t-md overflow-hidden"
		bind:this={toolbar}
	>
		{#if editors?.[0]}
			<ul
				class="flex items-center gap-1 animate-fadeIn animate-duration-200 text-sm"
				data-flip-id="toolbar"
			>
				<li>
					<TiptapButton
						onclick={() => editors![0].chain().focus().toggleBold().run()}
						isActive={editors![0].isActive('bold')}
					>
						<Icon name="bold" />
					</TiptapButton>
				</li>
				<li>
					<TiptapButton
						onclick={() => editors![0].chain().focus().toggleItalic().run()}
						isActive={editors![0].isActive('italic')}
					>
						<Icon name="italic" />
					</TiptapButton>
				</li>
				<li>
					<TiptapButton
						onclick={() => editors![0].chain().focus().toggleUnderline().run()}
						isActive={editors![0].isActive('underline')}
					>
						<Icon name="underline" />
					</TiptapButton>
				</li>
				<li>
					<TiptapButton
						onclick={() => editors![0].chain().focus().toggleStrike().run()}
						isActive={editors![0].isActive('strike')}
					>
						<Icon name="strike-through" />
					</TiptapButton>
				</li>
				<li>
					<TiptapButton
						onclick={() => editors![0].chain().focus().toggleHeading({ level: 1 }).run()}
						isActive={editors![0].isActive('heading', { level: 1 })}
					>
						<Icon name="h1" />
					</TiptapButton>
				</li>
				<li>
					<TiptapButton
						onclick={() => editors![0].chain().focus().toggleHeading({ level: 2 }).run()}
						isActive={editors![0].isActive('heading', { level: 2 })}
					>
						<Icon name="h2" />
					</TiptapButton>
				</li>
				<li>
					<TiptapButton
						onclick={() => editors![0].chain().focus().toggleHeading({ level: 3 }).run()}
						isActive={editors![0].isActive('heading', { level: 3 })}
					>
						<Icon name="h3" />
					</TiptapButton>
				</li>
				<li>
					<TiptapButton
						onclick={() => editors![0].chain().focus().toggleHeading({ level: 4 }).run()}
						isActive={editors![0].isActive('heading', { level: 4 })}
					>
						<Icon name="h4" />
					</TiptapButton>
				</li>
				<li>
					<TiptapButton
						onclick={() => editors![0].chain().focus().toggleHeading({ level: 5 }).run()}
						isActive={editors![0].isActive('heading', { level: 5 })}
					>
						<Icon name="h5" />
					</TiptapButton>
				</li>
				<li>
					<TiptapButton
						onclick={() => editors![0].chain().focus().toggleHeading({ level: 6 }).run()}
						isActive={editors![0].isActive('heading', { level: 6 })}
					>
						<Icon name="h6" />
					</TiptapButton>
				</li>
				<li>
					<TiptapButton
						onclick={() => editors![0].chain().focus().toggleBlockquote().run()}
						isActive={editors![0].isActive('blockquote')}
					>
						<Icon name="quotes" />
					</TiptapButton>
				</li>
			</ul>
		{/if}
	</div>

	<div
		bind:this={element}
		{...props}
		class={clsx(
			'c-tiptap--textarea',
			'relative',
			editor ? 'animate-fadeIn animate-duration-200' : 'opacity-0',
			props.class
		)}
	></div>
</div>
