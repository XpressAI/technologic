<script lang="ts">
	import type { Message } from '$lib/OpenAI';
	import { sendMessage } from '$lib/OpenAI';

	import { tick } from 'svelte';
	import MessageCard from '$lib/MessageCard.svelte';
	import IconEdit from '@tabler/icons-svelte/dist/svelte/icons/IconEdit.svelte';
	import IconTopologyStarRing3 from '@tabler/icons-svelte/dist/svelte/icons/IconTopologyStarRing3.svelte';
	import IconCopy from '@tabler/icons-svelte/dist/svelte/icons/IconCopy.svelte';
	import IconTrashX from '@tabler/icons-svelte/dist/svelte/icons/IconTrashX.svelte';

	import {
		currentMessageThread,
		currentConversation,
		addMessage
	} from '$lib/stores/technologicStores';

	import Menu from "$lib/Menu.svelte";
	import {renameConversation} from "../../lib/stores/technologicStores";

	let inputText = '';
	let afterMessages;
	let waiting = false;

	async function sendMessageToChat() {
		if (inputText.trim().length > 0) {
			const message: Message = {
				role: 'user',
				content: inputText
			};

			addMessage(message, { backend: 'human', model: 'egg' });

			inputText = '';
			waiting = true;
			const history = $currentMessageThread.messages.map(
				(msg) => $currentConversation?.messages[msg.self].message
			);
			const response = await sendMessage(message, history);
			waiting = false;
			addMessage(response, { backend: 'todo', model: 'even more todo' });
		}
	}

	$: scrollToEnd($currentMessageThread);
	async function scrollToEnd(_) {
		await tick();

		if (afterMessages) {
			afterMessages.scrollIntoView();
		}
	}

	async function fork(msg) {
		//forkConversation($currentConversation, msg);
	}
	$: conversationTitle = $currentConversation?.title || 'New conversation';

	function rename() {
		const newTitle = prompt('What name do you want to use?', conversationTitle);
		if (newTitle) {
			renameConversation(newTitle);
		}
	}

	async function renameWithSummary() {
		const message: Message = {
			role: 'user',
			content: 'In at most 3 words, summarize the chat history excluding this message'
		};

		const history = $currentMessageThread.messages.map(
				(msg) => $currentConversation?.messages[msg.self].message
		);

		const response = await sendMessage(message, history);

		const newTitle = response.content;
		if (newTitle) {
			renameConversation(newTitle);
		}
	}
</script>

<svelte:head>
	<title>{conversationTitle}</title>
</svelte:head>

<div class="flex-col flex h-[100vh]">
	<div class="p-5 pb-2 flex border-b">
		<h3 class="flex-grow">{conversationTitle}</h3>
		<div>
			<Menu id="conversation-menu">
				<ul class="card shadow-xl dark:shadow-slate-700 list-nav !bg-surface-50-900-token">
					<li>
						<a on:click={rename}>
							<span><IconEdit /></span>
							<span>Rename</span>
						</a>
					</li>
					<li>
						<a on:click={renameWithSummary}>
							<span><IconTopologyStarRing3 /></span>
							<span>Auto-Rename</span>
						</a>
					</li>
					<li>
						<a>
							<span><IconCopy /></span>
							<span>Duplicate</span>
						</a>
					</li>
					<li>
						<a>
							<span><IconTrashX /></span>
							<span>Delete</span>
						</a>
					</li>
				</ul>
			</Menu>
		</div>
	</div>
	<div class="flex-grow chat relative">
		<main class="absolute inset-0 overflow-y-scroll flex flex-col p-3">
			{#each $currentMessageThread.messages as msgAlt}
				{@const msg = $currentConversation?.messages[msgAlt.self]}
				<MessageCard
					msg={msg.message}
					selfPosition={msgAlt.messageIds.indexOf(msgAlt.self) + 1}
					alternativesCount={msgAlt.messageIds.length}
					on:fork={(e) => fork(msg)}
				/>
			{/each}
			{#if waiting}
				<MessageCard placeholder />
			{/if}
			<div bind:this={afterMessages} />
		</main>
	</div>
	<form on:submit|preventDefault={sendMessageToChat}>
		<label for="chat" class="sr-only">Your message</label>
		<div class="flex card p-2 gap-2 rounded-none variant-glass items-center">
			<textarea
				bind:value={inputText}
				id="chat"
				class="textarea p-2 flex-grow"
				placeholder="Your message..."
				on:keypress={(e) => {
					if (e.ctrlKey && e.code === 'Enter') {
						sendMessageToChat();
					}
				}}
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
