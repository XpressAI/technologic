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


	let inputText = '';
	let afterMessages;
	let waiting = false;
	let autoSend = true;
    let metaDown = false;

	$: forkMessageId = $currentConversation?.lastMessageId;

	$: conversationTitle = $currentConversation?.title || 'New conversation';

	async function chooseTool(message){
		const tools = {
				calculator: {
					explanation: 'Solves complicated calculations with precision.',
					instructions: `
# calculator
## execute <calculation>
Performs the calculation using javascript syntax and outputs the result.

\`\`\`
execute <calculation>
\`\`\`

Example:
\`\`\`
execute 1 + 1
\`\`\`
Output:
\`\`\`
2
\`\`\``,
					exec: async (toolSpec) => eval(toolSpec.arguments[0]),
					outputContext: 'This is the output of the calculation.'
				},
				'encyclopedia': {
					explanation: 'Provides information about a topic.',
					instructions: `
# encyclopedia
## query
Queries the encyclopedia for a topic. It produces up to 5 results. Its output is in JSON. During output processing, in-line reference the result you are using with a Footnote.

Example:
\`\`\`
query Constantine III
\`\`\`

Output:
\`\`\`
[
{id: 789, similarity: 0.9, attributes: {"text": "Constantine III (Latin: Flavius Claudius Constantinus; died shortly before 18 September 411) was a common Roman soldier who was declared emperor in Roman Britain in 407 and established himself in Gaul. He was recognised as co-emperor of the Roman Empire from 409 until 411.", "title": "Constantine III (Western Roman emperor)", "url": "https://en.wikipedia.org/wiki/Constantine_III_(Western_Roman_emperor)"}}
]
\`\`\``,
					outputContext: 'Answer the question using only the relevant entries in the context. Do not make a judgement on the quality of the results. Cite your sources by providing the urls for all used results.',
					exec: async (toolSpec) => console.log(toolSpec)
				},
				'more-context-tool': {
					explanation: 'Select this tool when you need clarification. A tool that will make the user provide you with more context in the current conversation.',
				},
				'noop': {
					explanation: 'A tool that signals that there is no need to use a tool.',
				},
				'no-applicable-tool': {
					explanation: 'A tool that signals that you don\'t have a good tool to resolve the query.',
				}
		}


		const basePrompt = `
You are "ToolSelector". The following is a list of tools and a description of their utility that are available. You will receive a query from a user. The query is part of a larger conversation that you don't have direct access to. Your responsibility is to select one of the tools to use to resolve the user's query.

You output everything as JSON formatted like the this:

\`\`\`json
{
    // Think step by step and provide a reasoning for what you think would be the best tool to use.
	reason: "",
	// Your actual tool selection.
	toolName: ""
}
\`\`\`

You output nothing else. Not even any reasoning.

---

`

		const toolPrompt = Object.keys(tools).map(key => `# ${key}\n${tools[key].explanation}\n`).join('\n\n')
		const fullPrompt = basePrompt + toolPrompt;

		const response = await $currentBackend.sendMessage([
			{
				role: 'system',
				content: fullPrompt
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
			if(selectedTool in tools){
				const tool = tools[selectedTool];
				const toolFn = async () => {
					const toolUsagePrompt = `
You are an AI assistant called "ToolBot". ToolBot is an intelligent chatbot that is designed to use the tool it is provided. ToolBot understands the given tool descriptions and APIs. First, ToolBot thinks step by step and provide a reasoning for what you think would be the method to use.
Only then provide your actual answer formatted as JSON like this:

\`\`\`json
{
	// Think step by step and provide a reasoning for what you think would be the best method to use.
	reason: "",
	// Your selected method
	method: "",
	// Your selected method's arguments
	arguments: ["", ""]
}
\`\`\`

---

`

					const toolResponse = await $currentBackend.sendMessage([
						{
							role: 'system',
							content: toolUsagePrompt + tool.instructions
						},
						message
					])

					const matches = toolResponse.content.matchAll(/```(?:json)?((?:\s|.)+?)```/gm);
					for (let match of matches) {
						try {
							const toolSpec = JSON.parse(match[1])
							const toolOutput = await tool.exec(toolSpec)

							return {
								role: 'system',
								content: 'Context: \n'+ toolOutput + '\n\n' + tool.outputContext
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
