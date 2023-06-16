<script lang="ts">
	import type { ResolvedFolder } from '$lib/stores/schema';
	import { page } from '$app/stores';
	import IconFolder from '@tabler/icons-svelte/dist/svelte/icons/IconFolder.svelte';
	import IconFolderPlus from '@tabler/icons-svelte/dist/svelte/icons/IconFolderPlus.svelte';
	import IconTrashX from '@tabler/icons-svelte/dist/svelte/icons/IconTrashX.svelte';
	import IconSubtask from '@tabler/icons-svelte/dist/svelte/icons/IconSubtask.svelte';
	import IconEdit from '@tabler/icons-svelte/dist/svelte/icons/IconEdit.svelte';
	import {
		folderStore
	} from '$lib/stores/technologicStores';
	import { flip } from 'svelte/animate';

	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';
	import Menu from '$lib/components/Menu.svelte';
	import { alert, prompt, confirm } from "$lib/components/dialogs";

	export let folder: ResolvedFolder;

	let isOpen = true;

	async function create() {
		const name = await prompt('Folder name');
		if (name) {
			folderStore.addFolder(folder, name);
		}
	}

	async function remove() {
		if (folder.contents.length > 0) {
			await alert('Folder is not empty. Please delete or move all items first.');
		} else {
			const reallyDelete = await confirm('Are you sure you want to delete this folder?');
			if (reallyDelete) {
				folderStore.removeFolder(folder);
			}
		}
	}

	async function rename() {
		const name = await prompt('Folder name', folder.name);
		if (name) {
			folderStore.renameFolder(folder, name);
		}
	}

	function handleDndConsider(e) {
		folder.contents = [...e.detail.items];
	}

	function handleDndComplete(e) {
		if (e.detail.info.trigger === 'droppedIntoZone') {
			const item = folder.contents.find((it) => it.id == e.detail.info.id);
			folder.contents = [...e.detail.items];
			folderStore.moveItemToFolder(item, folder);
		}
	}
</script>

<ul>
	<li class="flex folder overflow-hidden hover:overflow-visible">
		<a on:click={() => (isOpen = !isOpen)} class="!pl-0 btn justify-start flex-grow flex">
			<span>
				{#if isOpen}<IconFolder />{:else}<IconFolderPlus />{/if}
			</span>
			<span class="!ml-2 flex-grow flex-shrink text-left">{folder.name}</span>
			<span>
				<Menu size={1} id={folder.path.join('-')}>
					<ul
						class="card shadow-xl dark:shadow-slate-700 !bg-surface-50-900-token hover:!bg-surface-200-700-token list-nav"
					>
						<li>
							<a on:click={rename}>
								<span><IconEdit size="16" stroke="1" /></span>
								<span>Rename</span>
							</a>
						</li>
						<li>
							<a on:click={create}>
								<span><IconSubtask size="16" stroke="1" /></span>
								<span>New Folder</span>
							</a>
						</li>
						<li>
							<a on:click={remove}>
								<span><IconTrashX size="16" stroke="1" /></span>
								<span>Delete</span>
							</a>
						</li>
					</ul>
				</Menu>
			</span>
		</a>
	</li>
	{#if isOpen}
		<li class="ml-3 border-l border-l-gray-200 border-dashed max-w-full">
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
								class="overflow-hidden"
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
	{/if}
</ul>

<style lang="postcss">
	.folder :global(.menu) {
		@apply invisible;
	}

	.folder:hover :global(.menu),
	.folder:focus-within :global(.menu) {
		@apply visible;
	}
</style>
