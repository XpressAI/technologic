<script lang="ts">
	import IconDotsVertical from '@tabler/icons-svelte/dist/svelte/icons/IconDotsVertical.svelte';
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';

	export let id;
	export let size = 2;
	let popupSettings: PopupSettings = {
		// Set the event as: click | hover | hover-click | focus | focus-click
		event: 'click',
		// Provide a matching 'data-popup' value.
		target: `menu-${id}`,
		closeQuery: 'a'
	};
</script>

<div class="menu relative" on:click|stopPropagation>
	<button class="btn-icon variant-glass !p-1 !m-0 w-auto h-auto" use:popup={popupSettings}>
		<slot name="button">
			<span><IconDotsVertical stroke={size} size={size * 12} /></span>
		</slot>
	</button>
	<div data-popup="menu-{id}" style="z-index: 9999">
		<slot />
	</div>
</div>
