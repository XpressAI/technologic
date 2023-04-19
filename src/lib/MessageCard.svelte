<script>
	import CodeRenderer from '$lib/CodeRenderer.svelte';
	import SvelteMarkdown from 'svelte-markdown';
	import { createEventDispatcher } from 'svelte';
	import { CodeBlock } from '@skeletonlabs/skeleton';
	import IconGitBranch from '@tabler/icons-svelte/dist/svelte/icons/IconGitBranch.svelte';
	import Icon360 from '@tabler/icons-svelte/dist/svelte/icons/Icon360.svelte';
	import IconChevronLeft from '@tabler/icons-svelte/dist/svelte/icons/IconChevronLeft.svelte';
	import IconChevronRight from '@tabler/icons-svelte/dist/svelte/icons/IconChevronRight.svelte';
	import IconRefreshDot from '@tabler/icons-svelte/dist/svelte/icons/IconRefreshDot.svelte';
	import IconPencil from '@tabler/icons-svelte/dist/svelte/icons/IconPencil.svelte';
	import IconDeviceFloppy from '@tabler/icons-svelte/dist/svelte/icons/IconDeviceFloppy.svelte';
	import IconCircleX from '@tabler/icons-svelte/dist/svelte/icons/IconCircleX.svelte';
	import IconArrowMerge from '@tabler/icons-svelte/dist/svelte/icons/IconArrowMerge.svelte';
	import IconTrash from '@tabler/icons-svelte/dist/svelte/icons/IconTrash.svelte';

	export let msg = null;
	export let selfPosition = 0;
	export let alternativesCount = 0;
	export let placeholder = false;
	export let forkSelected = false;

	let messageText;

	const dispatch = createEventDispatcher();

	const fork = () => { dispatch('fork', msg); };
	const nextThread = () => { dispatch('nextThread', msg); };
	const prevThread = () => { dispatch('prevThread', msg); };
	const regenerate = () => { dispatch('regenerate', msg); };
	const merge = () => { dispatch('merge', msg); };
	const trash = () => { dispatch('trash', msg); };
	const saveInPlace = () => { dispatch('saveInPlace', {message: msg, newContent: messageText}); isEditing = false };
	const saveAndFork = () => { dispatch('saveAndFork', {message: msg, newContent: messageText}); isEditing = false };

	let isSource = false;

	function toggle_source() {
		isSource = !isSource;
	}

	let isEditing = false;

	function toggle_edit() {
		messageText = msg.content;
		isEditing = !isEditing;
	}
</script>

{#if placeholder}
	<section class="card m-2 variant-ghost animate-pulse">
		<div class="p-4 space-y-4">
			<div class="placeholder" />
			<div class="grid grid-cols-3 gap-8">
				<div class="placeholder" />
				<div class="placeholder" />
				<div class="placeholder" />
			</div>
			<div class="grid grid-cols-4 gap-4">
				<div class="placeholder" />
				<div class="placeholder" />
				<div class="placeholder" />
				<div class="placeholder" />
			</div>
		</div>
	</section>
{:else if isEditing}
	<div class="card px-4 pt-4 m-2 {msg.role === 'user' ? 'variant-glass' : 'variant-ghost'}"  class:fork-selected={forkSelected}>
		<textarea bind:value={messageText} class="w-full h-64 p-2 bg-surface-50-900-token" />
		<hr />
		<div class="flex items-center justify-between py-2">
			<div class="flex-grow" />
			<div class="flex items-center gap-3">
				<button
						type="button"
						class="btn variant-glass-primary hover:variant-ghost"
						on:click={saveInPlace}
				>
					<span>
						<IconDeviceFloppy size="18" />
					</span>
					<span>Save in-place</span>
				</button>
				<button
						type="button"
						class="btn variant-glass-primary hover:variant-ghost"
						on:click={saveAndFork}
				>
					<span>
						<IconGitBranch size="18" />
					</span>
					<span>Save & Fork</span>
				</button>
				<button
						type="button"
						class="btn variant-glass-primary hover:variant-ghost"
						on:click={toggle_edit}
				>
					<span>
						<IconCircleX size="18" />
					</span>
					<span>Cancel</span>
				</button>
			</div>
		</div>
	</div>
{:else}
	<div class="card px-4 pt-4 m-2 {msg.role === 'user' ? 'variant-glass' : 'variant-ghost'}"  class:fork-selected={forkSelected}>
		<p class="mb-3 font-normal text-gray-700 dark:text-gray-100 prose max-w-full">
			{#if isSource}
				<CodeBlock language="markdown" code={msg.content} />
			{:else}
				<SvelteMarkdown source={msg.content} renderers={{ code: CodeRenderer }} />
			{/if}
		</p>
		<hr />
		<div class="flex items-center justify-between py-2">
			{#if alternativesCount > 1}
				<div>
					<button class="p-[0.5rem] w-0.5 h-0.5 btn-icon btn-icon-sm variant-soft-tertiary"
							on:click={prevThread}
							disabled={selfPosition === 1}
					>
						<span>
							<IconChevronLeft size="12" />
						</span>
					</button>
					{selfPosition} / {alternativesCount}
					<button class="p-[0.5rem] w-0.5 h-0.5 btn-icon btn-icon-sm variant-soft-tertiary"
							on:click={nextThread}
							disabled={selfPosition === alternativesCount}
					>
						<span>
							<IconChevronRight size="12" />
						</span>
					</button>
				</div>
			{/if}
			<div class="flex-grow" />
			<div class="flex items-center gap-3">
				{#if msg.role === 'assistant'}
					<button
							type="button"
							class="btn-icon btn-icon-sm variant-glass hover:variant-ghost"
							title="Redo it!"
							on:click={regenerate}
					>
						<span>
							<IconRefreshDot size="18" />
						</span>
					</button>
				{/if}
				<button
						type="button"
						class="btn-icon btn-icon-sm variant-glass hover:variant-ghost"
						title="Edit it!"
						on:click={toggle_edit}
				>
					<span>
						<IconPencil size="18" />
					</span>
				</button>
				<button
						type="button"
						class="btn-icon btn-icon-sm variant-glass hover:variant-ghost"
						title="Trash it!"
						on:click={trash}
				>
					<span>
						<IconTrash size="18" />
					</span>
				</button>
				<button
					type="button"
					class="btn-icon btn-icon-sm variant-glass hover:variant-ghost"
					title="Fork it!"
					on:click={fork}
				>
					<span>
						<IconGitBranch size="18" />
					</span>
				</button>
				<button
						type="button"
						class="btn-icon btn-icon-sm variant-glass hover:variant-ghost"
						title="Merge it!"
						on:click={merge}
				>
					<span>
						<IconArrowMerge size="18" />
					</span>
				</button>
				<button
					type="button"
					class="btn-icon btn-icon-sm variant-glass hover:variant-ghost"
					title="Flip it!"
					on:click={toggle_source}
				>
					<span>
						<Icon360 size="18" />
					</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	.fork-selected {
		@apply shadow-violet-200 dark:shadow-violet-700 shadow-2xl;
	}
</style>
