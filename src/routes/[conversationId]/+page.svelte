<script lang="ts">
    import SvelteMarkdown from 'svelte-markdown';

    import type {Message} from "$lib/OpenAI.ts";
    import {sendMessage} from "$lib/OpenAI";

    import {tick} from "svelte";
    import hljs from 'highlight.js';
    import {page} from "$app/stores";
    import {allMessages, currentMessages } from "$lib/stores/allMessageStore";
    import {conversations} from "$lib/stores/conversationStore";
    import {CodeBlock} from "@skeletonlabs/skeleton";
    import CodeRenderer from "../../lib/CodeRenderer.svelte";
    import MessageCard from "../../lib/MessageCard.svelte";


    $: allMessages.setConversationId($page.params['conversationId']);
    $: conversationId = $page.params['conversationId'];

    $: {
        if(!$conversations.find((conv) => conv.id == conversationId)){
            $conversations = [...$conversations, {id: conversationId, title: "untitled"}]
        }
    }

    $: messages = $currentMessages;

    let inputText = "";
    let afterMessages;

    async function sendMessageToChat() {
        if (inputText.trim().length > 0) {
            const message: Message = {
                role: "user",
                content: inputText
            };
            allMessages.addMessage(message);
            inputText = '';
            const response = await sendMessage(message, messages);
            allMessages.addMessage(response)
        }
    }

    $: scrollToEnd(messages);
    async function scrollToEnd(_messages){
        await tick();

        if(afterMessages){
            afterMessages.scrollIntoView()
        }
    }

    async function fork(msg){
        const msg_idx = messages.indexOf(msg);
        const fork_messages = messages.slice(0, msg_idx + 1);
        const conv = $conversations.find((conv) => conv.id == conversationId);
        const fork_conv = {id: `${conv.id}-${$conversations.length}`, title: `${conv.title} Fork`};
        $allMessages[fork_conv.id] = fork_messages;
        $conversations = [...$conversations, fork_conv]

    }

</script>

<div class="flex-col flex h-[100vh]">
    <div class="flex-grow chat relative">
        <main class="absolute inset-0 overflow-y-scroll flex flex-col">
            {#each messages as msg}
                <MessageCard {msg} on:fork={(e) => fork(msg)}/>
            {/each}
            <div bind:this={afterMessages} />
        </main>
    </div>
    <form on:submit|preventDefault={sendMessageToChat}>
        <label for="chat" class="sr-only">Your message</label>
        <div class="flex items-end card p-2 flex gap-2 drop-shadow-lg">
            <textarea bind:value={inputText} id="chat"
                      class="textarea p-2"
                      placeholder="Your message..."></textarea>
            <button type="submit"
                    class="btn-icon variant-filled-primary">
                <span><svg aria-hidden="true" class="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20"
                     xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                </svg></span>
                <span class="sr-only">Send message</span>
            </button>
        </div>
    </form>
</div>


<style>


</style>
