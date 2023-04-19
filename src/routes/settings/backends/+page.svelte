<script lang="ts">
    import IconServer from '@tabler/icons-svelte/dist/svelte/icons/IconServer.svelte';
    import IconEdit from '@tabler/icons-svelte/dist/svelte/icons/IconEdit.svelte';


    import {configStore} from "$lib/stores/technologicStores";
    import type {BackendConfiguration} from "$lib/stores/schema";
    import {ListBox, ListBoxItem} from "@skeletonlabs/skeleton";

    $: currentBackend = $configStore.backends.find(backend => backend.name === $configStore.backend.name);

    function setBackend(backend: BackendConfiguration){
        $configStore = {
            ...$configStore,
            backend: {
                name: backend.name,
                model: backend.defaultModel
            }
        }
    }
</script>
<section class="card p-3 m-3 variant-glass">
    <h3>Backends</h3>
    <nav class="list-nav">
        <ul>
            {#each $configStore.backends as backend}
                <li>
                    <a href="#" on:click={() => setBackend(backend)} class:bg-surface-active-token={backend.name === $configStore.backend.name}>
                        <span><IconServer /></span>
                        <span class="flex-grow">
                            {backend.name}
                        </span>
                        <span>
                            <a href="/settings/backends/{backend.name}"><IconEdit /></a>
                        </span>
                    </a>
                </li>
            {/each}
        </ul>
    </nav>
</section>

<section class="card p-3 m-3 variant-glass">
    <h3>Models</h3>
    <ListBox>
        {#each currentBackend.models as model}
            <ListBoxItem bind:group={$configStore.backend.model} value={model}>
                {model}
            </ListBoxItem>
        {/each}
    </ListBox>
</section>
