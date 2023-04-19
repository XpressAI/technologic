<script lang="ts">
    import IconServer from '@tabler/icons-svelte/dist/svelte/icons/IconServer.svelte';
    import IconDeviceFloppy from '@tabler/icons-svelte/dist/svelte/icons/IconDeviceFloppy.svelte';
    import IconCircleLetterX from '@tabler/icons-svelte/dist/svelte/icons/IconCircleLetterX.svelte';
    import {configStore} from "$lib/stores/technologicStores";
    import {page} from "$app/stores";
    import type {BackendConfiguration} from "$lib/stores/schema";
    import {ListBox, ListBoxItem} from "@skeletonlabs/skeleton";
    import {goto} from "$app/navigation";

    $: backend = $configStore.backends.find(backend => backend.name === $page.params.backendName);

    let dto: BackendConfiguration;
    $: {
        if(!dto){
            dto = {...backend};
        }
    }

    async function save(){
        $configStore = {
            ...$configStore,
            backends: $configStore.backends.map(b => b.name === backend.name ? dto : b)
        }
        await goto("/settings/backends");
    }

</script>
<section class="card m-3 variant-glass">
    <h3 class="card-header flex gap-2 items-center">
        <span>
            <IconServer />
        </span>
        <span>
            Backend: {backend.name}
        </span>
    </h3>
    <div class="flex flex-col gap-2 p-5">
        <label class="label">
            <span>Name</span>
            <input class="input p-1" type="text" bind:value={dto.name} />
        </label>
        <label class="label">
            <span>Base URL</span>
            <input class="input p-1" type="text" bind:value={dto.url} placeholder="https://api.openai.com/v1" />
        </label>
        <label class="label">
            <span>Token</span>
            <input class="input p-1" type="password" bind:value={dto.token} />
        </label>
        <label class="label">
            <span>Default Model</span>
            <ListBox>
                {#each dto.models as model}
                    <ListBoxItem bind:group={dto.defaultModel} value={model}>{model}</ListBoxItem>
                {/each}
            </ListBox>
        </label>
    </div>
    <div class="card-footer px-5 flex">
        <div class="flex-grow"></div>
        <div>
            <button class="btn variant-filled-primary" on:click={save}>
                <span><IconDeviceFloppy /></span>
                <span>Save</span>
            </button>
            <a href="/settings/backends" class="btn variant-ringed-primary">
                <span><IconCircleLetterX /></span>
                <span>Cancel</span>
            </a>
        </div>
    </div>
</section>
