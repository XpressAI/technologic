<script lang="ts">
	import {tick} from 'svelte';
	import MessageCard from '$lib/components/MessageCard.svelte';
	import Menu from '$lib/components/Menu.svelte';

	import IconEdit from '@tabler/icons-svelte/dist/svelte/icons/IconEdit.svelte';
	import IconTopologyStarRing3 from '@tabler/icons-svelte/dist/svelte/icons/IconTopologyStarRing3.svelte';
	import IconCopy from '@tabler/icons-svelte/dist/svelte/icons/IconCopy.svelte';
	import IconTrashX from '@tabler/icons-svelte/dist/svelte/icons/IconTrashX.svelte';
	import IconGitCommit from '@tabler/icons-svelte/dist/svelte/icons/IconGitCommit.svelte';
	import IconSendOff from '@tabler/icons-svelte/dist/svelte/icons/IconSendOff.svelte';

	import {
		conversationStore,
		currentBackend,
		configStore
	} from '$lib/stores/technologicStores';
	import {drawerStore, ProgressRadial, SlideToggle} from '@skeletonlabs/skeleton';
	import {beforeNavigate, afterNavigate} from '$app/navigation';
	import { prompt, confirm } from "$lib/components/dialogs";
	import {page} from "$app/stores";
	import {generateAnswer} from './conversationBroker';
	import {goto} from "$app/navigation";
	import SubMenu from "$lib/components/SubMenu.svelte";
	import type {BackendConfiguration} from "$lib/stores/schema";

	let inputText = '';
	let afterMessages;
	let waiting = false;
	let autoSend = true;
    let metaDown = false;

	let isRenaming = false;

	beforeNavigate(async () => {
		if($currentConversation?.graph.length == 0 && $currentConversation?.isUntitled){
			await conversationStore.delete($currentConversation.id);
		}
	});

	afterNavigate(async ({to}) => {
		if(to.params?.conversationId == "new"){
			const conversation = await conversationStore.create();
			const unsubscribe = conversation.subscribe((value) => {
				if (value) {
					unsubscribe();
					goto(`/${value.id}`);
				}
			});
		}
	});

	$: currentConversation = conversationStore.get($page.params?.conversationId);
	$: currentMessageThread = currentConversation.messageThread;
	$: msgHistory = currentConversation.history;

	$: forkMessageId = $currentConversation?.lastMessageId;

	$: conversationTitle = $currentConversation?.title || 'New conversation';


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
			currentConversation.rename(newTitle);
		}
	}

	async function renameWithSummary(){
		isRenaming = true;
		await $currentBackend.renameConversationWithSummary(currentConversation);
		isRenaming = false;
	}

	async function deleteConv() {
		const confirmed = await confirm('Are you sure you want to delete this conversation?');
		if (confirmed) {
			await conversationStore.delete($currentConversation.id);
			goto('/');
		}
	}

	async function duplicate() {
		const confirmed = await confirm('Are you sure you want to duplicate this conversation?');
		if (confirmed) {
			const dup = await conversationStore.duplicate($currentConversation.id);
			const unsubscribe = dup.subscribe((value) => {
				if (value) {
					unsubscribe();
					goto(`/${value.id}`);
				}
			});
		}
	}

	async function selectPrevThread(msg, msgAlt) {
		const index = msgAlt.messageIds.indexOf(msg.id);
		if (index > 0) {
			await currentConversation.selectMessageThreadThrough($currentConversation.messages[msgAlt.messageIds[index - 1]]);
		}
	}

	async function selectNextThread(msg, msgAlt) {
		const index = msgAlt.messageIds.indexOf(msg.id);
		if (index < msgAlt.messageIds.length - 1) {
			await currentConversation.selectMessageThreadThrough($currentConversation.messages[msgAlt.messageIds[index + 1]]);
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

		await currentConversation.addMessage(newMessage, { ...msg.source, edited: true }, false, parent?.self);
	}

	async function saveInPlace(msg, newContent, newRole) {
		await currentConversation.replaceMessage(
				msg,
				{
					...msg,
					message: {
						...msg.message,
						role: newRole,
						content: newContent
					},
					source: { ...msg.source, edited: true }
				}
		);
	}

	async function merge(msg) {
		const messages = $currentMessageThread.messages;
		const position = messages.findIndex((it) => it.self === msg.id);
		const prevMessages = messages.slice(0, position);
		const parent = prevMessages[prevMessages.length - 1];
		const msgA = messages[parent.self];
		const msgB = msg;
		await saveAndFork(msgA, msgA.message.content + msgB.message.content, msgA.message.role);
	}

	async function trash(msg) {
		if (await confirm('Are you sure you want to delete this message?')) {
			await currentConversation.deleteMessage(msg);
		}
	}

	async function sendMessageToChat(){
		waiting = true;

		if (inputText.trim().length > 0) {
			let message = {
				role: 'user',
				content: inputText
			};

			const convMsg = await currentConversation.addMessage(message, { backend: 'human', model: 'egg' }, false, forkMessageId);
			forkMessageId = convMsg.id;
			inputText = '';
			if(!autoSend) {
				waiting = false;
				return;
			}
		}

		await currentConversation.setLastMessageId(forkMessageId);
		await generateAnswer(currentConversation, $currentBackend);
		waiting = false;
	}

	async function regenerate(msg){
		waiting = true;

		const messages = $currentMessageThread.messages;
		const position = messages.findIndex((it) => it.self === msg.id);
		const prevMessages = messages.slice(0, position);
		const parent = prevMessages[prevMessages.length - 1];

		await currentConversation.setLastMessageId(parent.self);
		await generateAnswer(currentConversation, $currentBackend);

		waiting = false;
	}

	function setBackend(backend: BackendConfiguration, model?: string) {
		$configStore = {
			...$configStore,
			backend: {
				name: backend.name,
				model: model ?? backend.defaultModel
			}
		};
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
					<li><hr /></li>
					<li>
						<SubMenu id="backends" name="Backend" position="left">
							<ul class="card shadow-xl dark:shadow-slate-700 list-nav !bg-surface-50-900-token">
								{#each $configStore.backends as backend}
									<li>
										<SubMenu id="backend-{backend.name}"
												 name={backend.name}
												 position="left"
												 selected={$configStore.backend.name === backend.name}
										>
											<ul class="card shadow-xl dark:shadow-slate-700 list-nav !bg-surface-50-900-token">
												{#each backend.models as model}
													<li><a on:click={() => setBackend(backend, model)}
														   class="btn" class:variant-filled={$configStore.backend.name === backend.name && $configStore.backend.model === model}
													>
														{model}
													</a></li>
												{/each}
											</ul>
										</SubMenu>
									</li>
								{/each}
							</ul>
						</SubMenu>
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
					isStreaming={msg.isStreaming}
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
