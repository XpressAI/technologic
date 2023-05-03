<script lang="ts">
	import { tick } from 'svelte';
	import MessageCard from '$lib/components/MessageCard.svelte';
	import Menu from '$lib/components/Menu.svelte';

	import IconEdit from '@tabler/icons-svelte/dist/svelte/icons/IconEdit.svelte';
	import IconTopologyStarRing3 from '@tabler/icons-svelte/dist/svelte/icons/IconTopologyStarRing3.svelte';
	import IconCopy from '@tabler/icons-svelte/dist/svelte/icons/IconCopy.svelte';
	import IconTrashX from '@tabler/icons-svelte/dist/svelte/icons/IconTrashX.svelte';
	import IconGitCommit from '@tabler/icons-svelte/dist/svelte/icons/IconGitCommit.svelte';
	import IconSendOff from '@tabler/icons-svelte/dist/svelte/icons/IconSendOff.svelte';

	import {
		currentMessageThread,
		currentConversation,
		addMessage,
		replaceMessage
	} from '$lib/stores/technologicStores';

	import {
		renameConversation,
		deleteConversation,
		duplicateConversation,
		selectMessageThreadThrough,
		deleteMessage,
		currentBackend
	} from '$lib/stores/technologicStores';
	import {drawerStore, ProgressRadial, SlideToggle} from '@skeletonlabs/skeleton';
	import type { Message } from '$lib/backend/types';

	import { prompt, confirm } from "$lib/components/dialogs";
	import {renderToolInstructions, renderToolSelectionInstructions, tools} from "$lib/tools";
	import type {MethodSpec, ToolCall, ToolSpec} from "$lib/tools/types";


	let inputText = '';
	let afterMessages;
	let waiting = false;
	let autoSend = true;
    let metaDown = false;

	$: forkMessageId = $currentConversation?.lastMessageId;

	$: conversationTitle = $currentConversation?.title || 'New conversation';

	async function chooseTool(message){
		const response = await $currentBackend.sendMessage([
			{
				role: 'system',
				content: renderToolSelectionInstructions(tools)
			},
			message
		])
		let match = null;
		try {
			match = JSON.parse(response.content);
		}catch (e) {
			console.warn("Could not parse response from tool selector.", response);
		}
		if(match){
			const selectedTool = match.toolName;
			const tool: ToolSpec = tools.find(tool => tool.name === selectedTool);
			if(tool){
				const toolFn = async () => {
					const toolResponse = await $currentBackend.sendMessage([
						{
							role: 'system',
							content: renderToolInstructions(tool)
						},
						message
					])

					const matches = toolResponse.content.matchAll(/```(?:json)?((?:\s|.)+?)```/gm);
					for (let match of matches) {
						try {
							const toolCall: ToolCall  = JSON.parse(match[1])
							const method = tool.methods?.find(it => it.name === toolCall.method)
							if(method){
								return await method.exec(toolCall)
							}else{
								console.warn("Selected method not in list of methods.", toolCall);
							}
						}catch (e) {
							console.warn("Could not parse response from tool.", toolResponse);
						}
					}
				}
				toolFn.toolName = selectedTool;
				return toolFn;
			}else{
				console.warn("Selected tool not in list of tools.", response);
			}
		}
	}

	async function sendMessageToChat() {
		waiting = true;
		let message: Message;
		if (inputText.trim().length > 0) {
			message = {
				role: 'user',
				content: inputText
			};


			await addMessage(message, { backend: 'human', model: 'egg' }, forkMessageId);
			forkMessageId = $currentConversation?.lastMessageId;
			inputText = '';

			const tool = await chooseTool(message);
			if(tool){
				const toolOutputMessage = await tool();
				if(toolOutputMessage){
					await addMessage(toolOutputMessage, { backend: tool.toolName, model: 'tool' }, forkMessageId);
				}
			}
			forkMessageId = $currentConversation?.lastMessageId;

			if(!autoSend) {
				waiting = false;
				return;
			}
		}


		let history;
		if (forkMessageId !== $currentConversation?.lastMessageId) {
			const forkMessageIdx = $currentMessageThread.messages.findIndex(
				(it) => it.self === forkMessageId
			);
			history = $currentMessageThread.messages
				.slice(0, forkMessageIdx + 1)
				.map((msg) => $currentConversation?.messages[msg.self].message);
		} else {
			history = $currentMessageThread.messages.map(
				(msg) => $currentConversation?.messages[msg.self].message
			);
		}

		const source = { backend: $currentBackend.name, model: $currentBackend.model };

		let conversation;
		let responseMessage;
		$currentBackend.sendMessageAndStream(history, async (content, done) => {
			if (!responseMessage) {
				responseMessage = await addMessage(
					{ role: 'assistant', content: content || '' },
					source,
					forkMessageId
				);
				conversation = $currentConversation;
				forkMessageId = $currentConversation?.lastMessageId;
				waiting = false;
			} else {
				responseMessage = await replaceMessage(
					responseMessage,
					{
						...responseMessage.message,
						content: responseMessage.message.content + content
					},
					responseMessage.source,
					conversation
				);
			}
			if(done && $currentConversation.isUntitled && $currentConversation.id == conversation.id){
				await renameWithSummary();
			}
		});
	}

	async function regenerate(msg) {
		waiting = true;
		const position = $currentMessageThread.messages.findIndex((it) => it.self === msg.id);
		const prevMessages = $currentMessageThread.messages.slice(0, position);
		const parent = prevMessages[prevMessages.length - 1];
		const history = prevMessages.map((msg) => $currentConversation?.messages[msg.self].message);

		const source = { backend: $currentBackend.name, model: $currentBackend.model };
		let conversation;
		let responseMessage;
		$currentBackend.sendMessageAndStream(history, async (content, done) => {
			if (!responseMessage) {
				responseMessage = await addMessage(
					{ role: 'assistant', content: content || '' },
					source,
					parent?.self
				);
				conversation = $currentConversation;
				waiting = false;
			} else {
				responseMessage = await replaceMessage(
					responseMessage,
					{
						...responseMessage.message,
						content: responseMessage.message.content + content
					},
					responseMessage.source,
					conversation
				);
			}
		});
	}

	$: scrollToEnd($currentMessageThread);
	async function scrollToEnd(_) {
		await tick();

		if (afterMessages) {
			afterMessages.scrollIntoView();
		}
	}

	async function fork(msg) {
		forkMessageId = msg.id;
	}

	async function rename() {
		const newTitle = await prompt('What name do you want to use?', conversationTitle);
		if (newTitle) {
			renameConversation(newTitle);
		}
	}

	let isRenaming = false;
	async function renameWithSummary() {
		const message: Message = {
			role: 'user',
			content: 'In at most 3 words, summarize the chat history excluding this message'
		};

		const history = $currentMessageThread.messages.map(
			(msg) => $currentConversation?.messages[msg.self].message
		);

		isRenaming = true;
		const response = await $currentBackend.sendMessage([...history, message]);

		const newTitle = response.content;
		if (newTitle) {
			renameConversation(newTitle);
		}
		isRenaming = false;
	}

	async function deleteConv() {
		const confirmed = await confirm('Are you sure you want to delete this conversation?');
		if (confirmed) {
			deleteConversation();
		}
	}

	async function duplicate() {
		const confirmed = await confirm('Are you sure you want to duplicate this conversation?');
		if (confirmed) {
			duplicateConversation();
		}
	}

	async function selectPrevThread(msg, msgAlt) {
		const index = msgAlt.messageIds.indexOf(msg.id);
		if (index > 0) {
			await selectMessageThreadThrough(msgAlt.messageIds[index - 1]);
		}
	}

	async function selectNextThread(msg, msgAlt) {
		const index = msgAlt.messageIds.indexOf(msg.id);
		if (index < msgAlt.messageIds.length - 1) {
			await selectMessageThreadThrough(msgAlt.messageIds[index + 1]);
		}
	}

	async function saveAndFork(msg, newContent, newRole) {
		const position = $currentMessageThread.messages.findIndex((it) => it.self === msg.id);
		const prevMessages = $currentMessageThread.messages.slice(0, position);
		const parent = prevMessages[prevMessages.length - 1];
		const newMessage = {
			...msg.message,
			role: newRole,
			content: newContent
		};

		await addMessage(newMessage, { ...msg.source, edited: true }, parent?.self);
	}

	async function saveInPlace(msg, newContent, newRole) {
		await replaceMessage(
			msg,
			{
				...msg.message,
				role: newRole,
				content: newContent
			},
			{ ...msg.source, edited: true }
		);
	}

	async function merge(msg) {
		const position = $currentMessageThread.messages.findIndex((it) => it.self === msg.id);
		const prevMessages = $currentMessageThread.messages.slice(0, position);
		const parent = prevMessages[prevMessages.length - 1];
		const msgA = $currentConversation?.messages[parent.self];
		const msgB = msg;
		await saveAndFork(msgA, msgA.message.content + msgB.message.content, msgA.message.role);
	}

	async function trash(msg) {
		if (await confirm('Are you sure you want to delete this message?')) {
			await deleteMessage(msg);
		}
	}
</script>

<svelte:head>
	<title>{conversationTitle}</title>
</svelte:head>

<div class="flex-col flex h-[100vh]">
	<div class="p-5 pb-2 flex border-b">
		<h3 class="flex-grow flex gap-1 items-center">
			{#if isRenaming || waiting}<ProgressRadial width="w-6" />{/if}
			{conversationTitle}
			{#if !autoSend}
				<IconSendOff />
			{/if}
		</h3>
		<div class="flex gap-2">
			{#if $currentConversation}
				<button
					class="btn-icon w-8 h-8 p-0 variant-soft-surface"
					on:click={() => drawerStore.open()}
				>
					<span><IconGitCommit /></span>
				</button>
			{/if}
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
						<a on:click={duplicate}>
							<span><IconCopy /></span>
							<span>Duplicate</span>
						</a>
					</li>
					<li>
						<a on:click={deleteConv}>
							<span><IconTrashX /></span>
							<span>Delete</span>
						</a>
					</li>
					<li><hr /></li>
					<li class="p-3">
						<SlideToggle name="slider-label" bind:checked={autoSend} size="sm">Auto Send</SlideToggle>
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
					source={`${msg.source.backend}/${msg.source.model}`}
					selfPosition={msgAlt.messageIds.indexOf(msgAlt.self) + 1}
					alternativesCount={msgAlt.messageIds.length}
					forkSelected={msg.id === forkMessageId}
					on:fork={(e) => fork(msg)}
					on:prevThread={(e) => selectPrevThread(msg, msgAlt)}
					on:nextThread={(e) => selectNextThread(msg, msgAlt)}
					on:regenerate={(e) => regenerate(msg)}
					on:saveAndFork={(e) => saveAndFork(msg, e.detail.newContent, e.detail.newRole)}
					on:saveInPlace={(e) => saveInPlace(msg, e.detail.newContent, e.detail.newRole)}
					on:merge={(e) => merge(msg)}
					on:trash={(e) => trash(msg)}
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
                on:keydown={(e) => {
                    if (navigator.userAgent.includes('Mac OS X')) {
                        if (e.code === "MetaLeft" || e.code === "MetaRight") {
                            metaDown = true;
                        } else if (e.code === "Enter" && metaDown) {
                            sendMessageToChat();
                        }
                    }
                }}
                on:keyup={(e) => {
                    if (navigator.userAgent.includes('Mac OS X')) {
                        if (e.code === "MetaLeft" || e.code === "MetaRight") {
                            metaDown = false;
                        }
                    }
                }}
				on:keypress={(e) => {
                    if (!navigator.userAgent.includes('Mac OS X')) {
						if (e.ctrlKey && e.code === 'Enter') {
						    sendMessageToChat();
					    }
					}
				}}
			/>
			<button type="submit" class="btn-icon variant-filled-primary">
				<span>
					<svg
						aria-hidden="true"
						class="w-6 h-6 rotate-90"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
						/>
					</svg>
				</span>
				<span class="sr-only">Send message</span>
			</button>
		</div>
	</form>
</div>

<style>
</style>
