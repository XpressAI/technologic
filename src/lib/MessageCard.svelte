<script>
import CodeRenderer from "$lib/CodeRenderer.svelte";
import SvelteMarkdown from "svelte-markdown";
import {createEventDispatcher} from "svelte";
import {CodeBlock} from "@skeletonlabs/skeleton";

export let msg;

const dispatch = createEventDispatcher();
function fork(msg){
    dispatch("fork", msg);
}

let isSource = false;
function toggle_source(){
    isSource = !isSource;
}
</script>

<div class="card p-4  m-2 {msg.role === 'user' ? 'variant-glass' : 'variant-ghost'} ">
    <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 prose max-w-full">
        {#if isSource}
            <CodeBlock language="markdown" code={msg.content} />
        {:else}
            <SvelteMarkdown source={msg.content} renderers={{code: CodeRenderer}}/>
        {/if}
    </p>
    <div class="flex items-center justify-between px-1 py-1">
        <div class="flex-grow"></div>
        <div class="flex items-center space-x-1">
            <button type="button" class="btn-icon btn-icon-sm variant-glass"
                    on:click={fork(msg)}>
                                    <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-git-fork" width="18" height="18" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                        <path d="M12 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                        <path d="M7 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                        <path d="M17 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                                        <path d="M7 8v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2 -2v-2" />
                                        <path d="M12 12l0 4" />
                                    </svg>
                                        </span>
                <span class="sr-only">Fork</span>
            </button>
            <button type="button" class="btn-icon btn-icon-sm variant-glass"
                    on:click={toggle_source}>
                                    <span>
                                    T
                                        </span>
                <span class="sr-only">Fork</span>
            </button>
        </div>
    </div>
</div>
