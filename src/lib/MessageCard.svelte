<script>
	import CodeRenderer from '$lib/CodeRenderer.svelte';
	import SvelteMarkdown from 'svelte-markdown';
	import { createEventDispatcher } from 'svelte';
	import { CodeBlock } from '@skeletonlabs/skeleton';
	import IconGitBranch from '@tabler/icons-svelte/dist/svelte/icons/IconGitBranch.svelte';
	import Icon360 from '@tabler/icons-svelte/dist/svelte/icons/Icon360.svelte';
	import IconChevronLeft from '@tabler/icons-svelte/dist/svelte/icons/IconChevronLeft.svelte';
	import IconChevronRight from '@tabler/icons-svelte/dist/svelte/icons/IconChevronRight.svelte';

	export let msg = null;
	export let selfPosition = 0;
	export let alternativesCount = 0;
	export let placeholder = false;

	const dispatch = createEventDispatcher();

	function fork(msg) {
		dispatch('fork', msg);
	}

	let isSource = false;

	function toggle_source() {
		isSource = !isSource;
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
{:else}
	<div class="card px-4 pt-4 m-2 {msg.role === 'user' ? 'variant-glass' : 'variant-ghost'} ">
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
					<button class="p-[0.5rem] w-0.5 h-0.5 btn-icon btn-icon-sm variant-soft-tertiary">
						<span>
							<IconChevronLeft size="12" />
						</span>
					</button>
					{selfPosition} / {alternativesCount}
					<button class="p-[0.5rem] w-0.5 h-0.5 btn-icon btn-icon-sm variant-soft-tertiary">
						<span>
							<IconChevronRight size="12" />
						</span>
					</button>
				</div>
			{/if}
			<div class="flex-grow" />
			<div class="flex items-center gap-3">
				<button
					type="button"
					class="btn-icon btn-icon-sm variant-glass hover:variant-ghost"
					title="Fork it!"
					on:click={fork(msg)}
				>
					<span>
						<IconGitBranch size="18" />
					</span>
					<span class="sr-only">Fork it</span>
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
					<span class="sr-only">Flip it</span>
				</button>
			</div>
		</div>
	</div>
{/if}
