<script lang="ts">
	import type { ResolvedFolder } from './stores/schema';
	import { page } from '$app/stores';
	import IconFolder from '@tabler/icons-svelte/dist/svelte/icons/IconFolder.svelte';
	import IconFolderPlus from '@tabler/icons-svelte/dist/svelte/icons/IconFolderPlus.svelte';
	import IconCirclePlus from '@tabler/icons-svelte/dist/svelte/icons/IconCirclePlus.svelte';
	import { addFolder, moveItemToFolder } from './stores/technologicStores';
	import { flip } from 'svelte/animate';
	import IconDotsVertical from '@tabler/icons-svelte/dist/svelte/icons/IconDotsVertical.svelte';


	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';

	export let folder: ResolvedFolder;

	let isOpen = true;

	function createFolder() {
		const name = prompt('Folder name');
		if (name) {
			addFolder(folder, name);
		}
	}

	function handleDndConsider(e) {
		folder.contents = [...e.detail.items];
	}

	function handleDndComplete(e) {
		if (e.detail.info.trigger === 'droppedIntoZone') {
			const item = folder.contents.find((it) => it.id == e.detail.info.id);
			folder.contents = [...e.detail.items];
			moveItemToFolder(item, folder);
		}
	}
</script>

<ul>
	<li class="flex">
		<a on:click={() => (isOpen = !isOpen)} class="!pl-0 btn justify-start flex-grow">
			<span>
				{#if isOpen}<IconFolder />{:else}<IconFolderPlus />{/if}
			</span>
			<span class="!ml-2">{folder.name}</span>
		</a>
		<button class="!p-1 w-3 btn btn-icon-sm">
			<span><IconDotsVertical size="16" stroke="1" /></span>
		</button>
	</li>
	{#if isOpen}
		<li class="ml-3 border-l border-l-gray-200 border-dashed">
			<ul
				use:dndzone={{
					items: folder.contents,
					centreDraggedOnCursor: true,
					dropTargetStyle: {},
					dropTargetClasses: ['variant-glass', 'pb-5'],
					flipDurationMs: 100
				}}
				on:consider={handleDndConsider}
				on:finalize={handleDndComplete}
			>
				{#each folder.contents.filter((it) => it.id !== SHADOW_PLACEHOLDER_ITEM_ID) as content (content.id)}
					<li class="pl-2" animate:flip={{ duration: 100 }}>
						{#if content.isDndShadowItem}
							<a href="#" class="bg-primary-active-token">&nbsp;</a>
						{:else if content.type === 'folder'}
							<svelte:self folder={content.item} />
						{:else}
							<a
								href="/{content.id}"
								class:bg-primary-active-token={$page.params.conversationId === content.id}
							>
								{content.item.title}
							</a>
						{/if}
					</li>
				{/each}
			</ul>
		</li>
		<li>
			<a on:click={createFolder} class="!pl-1 btn justify-start">
				<span><IconCirclePlus size="16" stroke="1" /></span>
				<span class="!ml-2">New folder</span>
		</li>
	{/if}
</ul>
