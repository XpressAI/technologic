<script lang="ts">
	import ChevronLeft from '@tabler/icons-svelte/dist/svelte/icons/IconChevronLeft.svelte';
	import ChevronRight from '@tabler/icons-svelte/dist/svelte/icons/IconChevronRight.svelte';
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';

	export let id;
	export let position: 'left' | 'right';
	export let name: string;
	export let selected: boolean = false;
	let popupSettings: PopupSettings = {
		// Set the event as: click | hover | hover-click | focus | focus-click
		event: 'click',
		placement: position,
		// Provide a matching 'data-popup' value.
		target: `menu-${id}`,
		closeQuery: 'a',
		middleware: {
			offset: 1
		}
	};
</script>

<div class="menu relative" on:click|stopPropagation>
	<div use:popup={popupSettings} class="w-full btn cursor-pointer [&>*]:pointer-events-none flex" class:variant-filled={selected}>
		<div class="flex-shrink -ml-3">
		{#if position == 'left'}
			<ChevronLeft />
		{:else}
			<ChevronRight />
		{/if}
		</div>
		<div class="flex-auto justify-items-start-start">
			{name}
		</div>
	</div>
	<div data-popup="menu-{id}" style="z-index: 9999">
		<slot />
	</div>
</div>
