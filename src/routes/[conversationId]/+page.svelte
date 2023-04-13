<script lang="ts">
	import type { Message } from '$lib/OpenAI';
	import { sendMessage } from '$lib/OpenAI';

	import { tick } from 'svelte';
	import { page } from '$app/stores';
	import MessageCard from '$lib/MessageCard.svelte';

	import { technologic } from '$lib/stores/technologicStore';

	import IconDotsVertical from '@tabler/icons-svelte/dist/svelte/icons/IconDotsVertical.svelte';

	let { currentMessages, currentConversation, addMessage, createConversation, forkConversation } =
		technologic;

	let inputText = '';
	let afterMessages;
	let waiting = false;

	async function sendMessageToChat() {
		if (inputText.trim().length > 0) {
			const message: Message = {
				role: 'user',
				content: inputText
			};

			if (!$currentConversation) {
				createConversation($page.params.conversationId);
			}

			addMessage($currentConversation, message);
			inputText = '';
			waiting = true;
			const history = $currentMessages.map((msg) => msg.message);
			const response = await sendMessage(message, history);
			waiting = false;
			addMessage($currentConversation, response);
		}
	}

	$: scrollToEnd($currentMessages);
	async function scrollToEnd(_messages) {
		await tick();

		if (afterMessages) {
			afterMessages.scrollIntoView();
		}
	}

	async function fork(msg) {
		forkConversation($currentConversation, msg);
	}
	$: conversationTitle = $currentConversation?.title || 'New conversation';
</script>

<svelte:head>
	<title>{conversationTitle}</title>
</svelte:head>

<div class="flex-col flex h-[100vh]">
	<div class="p-5 pb-2 flex border-b">
		<h3 class="flex-grow">{conversationTitle}</h3>
		<div>
			<button class="btn-icon variant-glass">
				<span><IconDotsVertical /></span>
			</button>
		</div>
	</div>
	<div class="flex-grow chat relative">
		<main class="absolute inset-0 overflow-y-scroll flex flex-col p-3">
			{#each $currentMessages as msg}
				<MessageCard msg={msg.message} on:fork={(e) => fork(msg)} />
			{/each}
			{#if waiting}
				<MessageCard placeholder />
			{/if}
			<div bind:this={afterMessages} />
		</main>
	</div>
	<form on:submit|preventDefault={sendMessageToChat}>
		<label for="chat" class="sr-only">Your message</label>
		<div class="flex items-end card p-2 flex gap-2 rounded-none variant-glass">
			<textarea
				bind:value={inputText}
				id="chat"
				class="textarea p-2"
				placeholder="Your message..."
				on:keypress={(e) => {if(e.ctrlKey && e.code === 'Enter'){sendMessageToChat()}}}
			/>
			<button type="submit" class="btn-icon variant-filled-primary">
				<span
					><svg
						aria-hidden="true"
						class="w-6 h-6 rotate-90"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
						/>
					</svg></span
				>
				<span class="sr-only">Send message</span>
			</button>
		</div>
	</form>
</div>

<style>
</style>
