<script lang="ts">
    import IconEdit from '@tabler/icons-svelte/dist/svelte/icons/IconEdit.svelte';
    import IconCheck from '@tabler/icons-svelte/dist/svelte/icons/IconCheck.svelte';

    import {createEventDispatcher} from "svelte";
    const dispatch = createEventDispatcher();

    export let value;
    export let initialEditing = false;

    let isEditing = initialEditing;
</script>

{#if isEditing}
    <div class="input-group input-group-divider grid-cols-[1fr_auto]">
        <input class="p-1" type="text" bind:value />
        <button class="variant-filled-primary"
                on:click={() => {
                    isEditing = false;
                    dispatch('change', value);
                }}
        >
            <IconCheck />
        </button>
    </div>
{:else}
    <div class="flex gap-2 items-center w-full bg-primary-hover-token p-1">
        <div class="flex-grow">{value}</div>
        <button class="btn-icon w-8 p-0 variant-soft" on:click={() => isEditing = true}>
            <span>
                <IconEdit size="16"/>
            </span>
        </button>
    </div>
{/if}
