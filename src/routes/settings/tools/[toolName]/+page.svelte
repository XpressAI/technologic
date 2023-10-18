<script lang="ts">
import {toolStore} from "$lib/stores/technologicStores.js";
import IconTool from '@tabler/icons-svelte/dist/svelte/icons/IconTool.svelte';
import IconEdit from '@tabler/icons-svelte/dist/svelte/icons/IconEdit.svelte';
import {derived} from "svelte/store";
import {page} from "$app/stores";
import { AceEditor } from 'svelte-ace';
import 'brace/theme/dracula';
import 'brace/mode/typescript';

const index = derived(page, $page => $toolStore.tools.findIndex(it => it.name == $page.params.toolName))
$: tool = $toolStore.tools[$index];


function save(){
    $toolStore = $toolStore;
}

function removeExample(method, example){
    method.examples = method.examples.filter(it => it !== example)
    save();
}

function addExample(method){
    method.examples = [...method.examples, {}]
    save();
}

function removeArg(method, arg){
    method.arguments = method.arguments.filter(it => it !== arg)
    save();
}

function addArg(method){
    method.arguments = [...method.arguments, {}]
    save();
}

function addMethod(){
    tool.methods = [...tool.methods, {
        examples: [],
        arguments: []
    }]
    save();
}


function removeMethod(method){
    tool.methods = tool.methods.filter(it => it !== method)
    save();
}
</script>

<section class="card p-3 m-3 variant-glass flex flex-col gap-2">
    <h3><input class="input" bind:value={tool.name} /></h3>
    <div class="flex flex-row gap-2">
        <label class="label">Explanation</label>
        <textarea class="textarea p-1">{tool.explanation}</textarea>
    </div>
    {#each tool.methods as method}
        <h4><input class="input" bind:value={method.name}></h4>
        <div>
            <button class="btn" on:click={() => removeMethod(method)}>Remove Method</button>
        </div>
        <div class="flex flex-col gap-2">
            {#each method.arguments as arg}
                <div class="flex flex-row gap-2">
                    <label>Name</label>
                    <input type="text" class="input" bind:value={arg.name} />
                </div>
                <div class="flex flex-row gap-2">
                    <label>Type</label>
                    <input type="text" class="input" bind:value={arg.type} />
                </div>
                <div class="flex flex-row gap-2">
                    <label>Description</label>
                    <input type="text" class="input" bind:value={arg.doc} />
                </div>
                <div>
                    <button class="btn" on:click={() => removeArg(method, arg)}>Remove Argument</button>
                </div>
                <hr />
            {/each}
            <div>
                <button class="btn" on:click={() => addArg(method)}>Add Argument</button>
            </div>
        </div>
        <div class="flex flex-row gap-2">
            <label class="label">Code</label>
            <AceEditor
                    bind:value={method.fnSrc}
                    lang="typescript"
                    theme="dracula"
                    width="100%"
                    height="400px"
            />
        </div>
        <h3>Examples</h3>
        <div class="flex flex-col gap-2">
            {#each method.examples as example}
                <div class="flex flex-row gap-2">
                    <label>Input</label>
                    <input type="text" class="input" bind:value={example.input} />
                </div>
                <div class="flex flex-row gap-2">
                    <label>Output</label>
                    <input type="text" class="input" bind:value={example.output} />
                </div>
                <div>
                    <button class="btn" on:click={() => removeExample(method, example)}>Remove Example</button>
                </div>
                <hr />
            {/each}
            <div>
                <button class="btn" on:click={() => addExample(method)}>Add Example</button>
            </div>
        </div>
    {/each}
    <div>
        <button class="btn" on:click={() => addMethod()}>Add Method</button>
    </div>

    <button class="btn" on:click={save}>Save</button>
</section>
