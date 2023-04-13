<script lang="ts">
    import type {Folder} from "./stores/folderStore";
    import {page} from "$app/stores";
    import {allConversations} from "./stores/conversationStore";
    import IconFolder from '@tabler/icons-svelte/dist/svelte/icons/IconFolder.svelte';
    import IconFolderPlus from '@tabler/icons-svelte/dist/svelte/icons/IconFolderPlus.svelte';

    export let folder: Folder;

    let isOpen = true;
</script>
<ul>
    <li class="cursor-pointer">
        <a on:click={() => isOpen = !isOpen} class="btn justify-start">
            <span>{#if isOpen}<IconFolder />{:else}<IconFolderPlus />{/if}</span>
            <span>{folder.name}</span>
        </a>
    </li>
    {#if isOpen}
    {#each folder.folders as folder}
        <li><svelte:self folder={folder}/></li>
    {/each}
    {#each folder.conversations as convId}

        {@const conversation = $allConversations[convId]}
        <li>
            <a href="/{conversation.id}"
               class:bg-primary-active-token={$page.params.conversationId === conversation.id}>
                {conversation.title}
            </a>
        </li>
    {/each}
    {/if}
</ul>
