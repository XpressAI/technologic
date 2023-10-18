<script lang="ts">
import {toolStore} from "$lib/stores/technologicStores.js";
import IconTool from '@tabler/icons-svelte/dist/svelte/icons/IconTool.svelte';
import IconEdit from '@tabler/icons-svelte/dist/svelte/icons/IconEdit.svelte';
import IconTrash from '@tabler/icons-svelte/dist/svelte/icons/IconTrash.svelte';

function toggleTool(tool){
    toolStore.update(curVal => {
        return {
            tools: curVal.tools.map(t => {
                if(t == tool){
                    t.enabled = !t.enabled;
                }
                return t;
            })
        }
    })
}

function addTool(){
    $toolStore = {
        tools: [...$toolStore.tools,
            {
                name: "New Tool ("+$toolStore.tools.length+")",
                enabled: false,
                methods: []
            }
        ]
    }
}

function removeTool(tool){
    $toolStore = {
        tools: [...$toolStore.tools.filter(it => it !== tool)]
    }
}
</script>

<section class="card p-3 m-3 variant-glass flex flex-col gap-2">
    <h3>Tools</h3>
    <nav class="list-nav">
        <ul>
            {#each $toolStore.tools as tool}
                <li>
                    <a
                            href="#"
                            on:click={() => toggleTool(tool)}
                            class:bg-surface-active-token={tool.enabled}
                    >
                        <span><IconTool /></span>
                        <span class="flex-grow">
							{tool.name}
						</span>
                        <span>
							<a href="/settings/tools/{tool.name}"><IconEdit /></a>
						</span>
                    </a>
                    <a on:click={removeTool(tool)}><IconTrash /></a>
                </li>
            {/each}
            <li><button class="btn" on:click={addTool}>Add Tool</button></li>
        </ul>
    </nav>
</section>
