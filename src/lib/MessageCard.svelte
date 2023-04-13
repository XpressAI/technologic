<script>
	import CodeRenderer from '$lib/CodeRenderer.svelte';
	import SvelteMarkdown from 'svelte-markdown';
	import { createEventDispatcher } from 'svelte';
	import { CodeBlock } from '@skeletonlabs/skeleton';
	import IconGitBranch from '@tabler/icons-svelte/dist/svelte/icons/IconGitBranch.svelte';
	import Icon360 from '@tabler/icons-svelte/dist/svelte/icons/Icon360.svelte';

	export let msg;

	const dispatch = createEventDispatcher();

	function fork(msg) {
		dispatch('fork', msg);
	}

	let isSource = false;

	function toggle_source() {
		isSource = !isSource;
	}
</script>

<div class="card px-4 pt-4 m-2 {msg.role === 'user' ? 'variant-glass' : 'variant-ghost'} ">
	<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 prose max-w-full">
		{#if isSource}
			<CodeBlock language="markdown" code={msg.content} />
		{:else}
			<SvelteMarkdown source={msg.content} renderers={{ code: CodeRenderer }} />
		{/if}
	</p>
	<div class="flex items-center justify-between py-2">
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
