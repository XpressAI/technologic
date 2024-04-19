import { writable, get, derived } from 'svelte/store';
import type { Readable, Writable } from 'svelte/store';
import localforage from 'localforage';
import type { Message } from '$lib/backend/types';
import type {
	BackendConfiguration,
	Configuration,
	Conversation,
	ConversationsRepository, ConversationStore, ConversationStub,
	Folder,
	FolderContent, FolderStore,
	MessageAlternative,
	MessageContainer,
	MessageSource,
	MessageThread,
	ResolvedFolder, StubDB
} from './schema';
import { createItemStore } from '$lib/stores/utils';
import { throwError } from 'svelte-preprocess/dist/modules/errors';
import { createBackend } from "$lib/backend/BackendFactory";

// these can be configured in the frontend (except for 'api')
function defaultBackends(): BackendConfiguration[] {
	return [
		{
			api: 'openai', // readonly, must exist in BackendFactory#backends
			name: 'OpenAI',
			url: 'https://api.openai.com/v1',
			models: ['gpt-3.5-turbo'],
			defaultModel: 'gpt-3.5-turbo',
			token: 'YOUR_TOKEN_HERE',
		},
		{
			api: 'anthropic', // readonly, must exist in BackendFactory#backends
			name: 'Anthropic',
			url: 'https://api.anthropic.com/v1',
			models: ['claude-3-opus-20240229'],
			defaultModel: 'claude-3-opus-20240229',
			token: 'YOUR_API_KEY_HERE',
		},
		{
			api: 'openchat', // readonly, must exist in BackendFactory#backends
			name: 'OpenChat',
			url: 'http://localhost:18888/v1',
			models: ['openchat_3.5'],
			defaultModel: 'openchat_3.5',
			token: 'YOUR_TOKEN_HERE', // if its locally hosted, the token probably does not matter
		}
	];
}

const configStore = createItemStore<Configuration>('technologic', 'config', 'config', {
	backends: defaultBackends(),
	backend: {
		name: defaultBackends()[0].name,
		model: defaultBackends()[0].defaultModel
	}
});

const currentBackend = derived(configStore, ($configStore) => {
	const backendConfig = $configStore.backends.find((it) => it.name === $configStore.backend.name);
	if (backendConfig === undefined) {
		throw new Error('No backend config found');
	}
	return createBackend(backendConfig, $configStore.backend.model);
});


function createDB<T, R>(database: string, table: string, stubConverter: (item: T) => R){
	const db = localforage.createInstance({
		name: database,
		storeName: table,
		driver: localforage.INDEXEDDB
	});

	const initialized = writable<boolean>(false);
	const ready = db.ready().then(() => initialized.set(true));

	const activeSubscriptions = new Map<string, Writable<T | null>>();

	const stubList = writable<StubDB<R>>({});
	initialized.subscribe(async (isInitialized) => {
		if(!isInitialized) return {};
		const newValue: StubDB<R> = {};
		await db.iterate((value: T, key) => {
			newValue[key] = stubConverter(value);
		});
		stubList.set(newValue);
	});

	return {
		initialized,
		list: stubList,
		getItem(key: string): Readable<T | null> {
			if(activeSubscriptions.has(key)){
				return activeSubscriptions.get(key)!;
			}

			const itemStore: Writable<T | null> = writable(null);
			activeSubscriptions.set(key, itemStore);

			ready.then(() => {
				db.getItem<T>(key).then((value) => {
					itemStore.set(value);
				})
			});

			return itemStore;
		},
		async setItem(key: string, value: T){
			await ready;
			await db.setItem(key, value)
			stubList.update((it) => {
				return {
					...it,
					[key]: stubConverter(value)
				}
			});

			if(activeSubscriptions.has(key)){
				activeSubscriptions.get(key)?.set(value);
			}
		},
		async nextKey(){
			const keys = (await db.keys()).map(it => parseInt(it, 10))
			return keys.length == 0 ? "1" : (Math.max(...keys) + 1).toString();
		},
		async removeItem(key: string){
			await ready;
			await db.removeItem(key);
			stubList.update((it) => {
				const newValue = {...it};
				delete newValue[key];
				return newValue;
			});

			if(activeSubscriptions.has(key)){
				activeSubscriptions.get(key)?.set(null);
				activeSubscriptions.delete(key);
			}
		}
	}
}

function createConversationsRepository(database: string, table: string): ConversationsRepository {
	const eventTarget = new EventTarget();
	const db = createDB<Conversation, ConversationStub>(database, table,(it) => {
		return {
			id: it.id,
			title: it.title
		}
	});

	async function createConversation(){
		const conversation: Conversation = {
			id: await db.nextKey(),
			title: "Untitled",
			isUntitled: true,
			messages: {},
			graph: [],
			lastMessageId: undefined
		};
		await db.setItem(conversation.id, conversation);
		eventTarget.dispatchEvent(new CustomEvent("create", {detail: conversation.id}));
		return getConversation(conversation.id);
	}

	async function duplicateConversation(conversationId: string){
		const conversation = get(await db.getItem(conversationId))!;
		const newConversation = {
			...conversation,
			id: await db.nextKey(),
			title: conversation.title + " (copy)",
		};
		await db.setItem(newConversation.id, newConversation);
		eventTarget.dispatchEvent(new CustomEvent("clone", {detail: {orig: conversationId, clone: newConversation.id}}));
		return getConversation(newConversation.id);
	}

	async function deleteConversation(conversationId: string) {
		await db.removeItem(conversationId);
		eventTarget.dispatchEvent(new CustomEvent("delete", {detail: conversationId}));
	}
	function getConversation(conversationId: string): ConversationStore {
		const _currentConversation = db.getItem(conversationId);
		const messageThread: Readable<MessageThread> = derived(
			_currentConversation,
			($currentConversation) => {
				const messages: MessageAlternative[] = [];
				if ($currentConversation !== null) {
					const lastMessageId = $currentConversation.lastMessageId;

					if (lastMessageId !== undefined) {
						let currentMessageId: string | undefined = lastMessageId;
						while (currentMessageId !== undefined) {
							const parentMessageId = $currentConversation.graph.find(
								(it) => it.to === currentMessageId
							)?.from;
							const siblingMessageIds = $currentConversation.graph.filter(
								(it) => it.from === parentMessageId
							);
							messages.unshift({
								self: currentMessageId,
								messageIds: siblingMessageIds?.map((it) => it.to) ?? []
							});
							currentMessageId = parentMessageId;
						}
					}
				}

				return {
					messages: messages
				} as MessageThread;
			}
		);
		const history = derived([messageThread, _currentConversation], ([$messageThread, $currentConversation]) =>
				$messageThread.messages.map(
					(msg) => $currentConversation?.messages[msg.self].message
				)
		);

		return {
			..._currentConversation,
			messageThread,
			history,
			async addMessage(msg: Message, source: MessageSource, isStreaming: boolean, parentMessageId?: string) {
				const conversation = get(_currentConversation)!;

				const container: MessageContainer = {
					id: Object.keys(conversation.messages ?? {}).length.toString(),
					source: source,
					isStreaming: isStreaming,
					message: msg
				};

				const updatedConversation: Conversation = {
					...conversation,
					messages: {
						...conversation.messages,
						[container.id]: container
					},
					graph: [...conversation.graph, {from: parentMessageId, to: container.id}],
					lastMessageId: container.id
				}
				await db.setItem(conversation.id, updatedConversation);
				return container;
			},
			async replaceMessage(orig: MessageContainer, newMessage: MessageContainer) {
				const conversation = get(_currentConversation)!;
				const updatedConversation: Conversation = {
					...conversation,
					messages: {
						...conversation.messages,
						[orig.id]: newMessage
					}
				};
				await db.setItem(conversation.id, updatedConversation);
				return newMessage;
			},
			async deleteMessage(orig: MessageContainer) {
				const conversation = get(_currentConversation)!;
				// Remove orig from graph and replace its parent/child connections s.t. they are connected directly
				const parentLink = conversation.graph.find((it) => it.to === orig.id);
				const childLinks = conversation.graph.filter((it) => it.from === orig.id);
				const newGraph = conversation.graph.filter(
					(it) => it.from !== orig.id && it.to !== orig.id
				);
				const newChildLinks = childLinks.map((it) => ({from: parentLink?.from, to: it.to}));
				const newConversation = {
					...conversation,
					messages: Object.fromEntries(
						Object.entries(conversation.messages).filter(([key, value]) => key !== orig.id)
					),
					graph: [...newGraph, ...newChildLinks],
					lastMessageId:
						conversation.lastMessageId === orig.id
							? parentLink?.from
							: conversation.lastMessageId
				};
				await db.setItem(newConversation.id, newConversation);
			},
			async rename(title: string) {
				const conversation = get(_currentConversation)!;
				const newConversation = {
					...conversation,
					isUntitled: false,
					title: title
				};
				await db.setItem(newConversation.id, newConversation);
			},
			async selectMessageThreadThrough(message: MessageContainer) {
				const conversation = get(_currentConversation)!;
				if (!message) return;

				let target = conversation.graph.find((it) => it.from === message.id)?.to;
				if (!target) {
					target = message.id;
				} else {
					while (target != null) {
						const next = conversation.graph.find((it) => it.from === target)?.to;
						if (next == null) break;
						target = next;
					}
				}

				const newConversation = {
					...conversation,
					lastMessageId: target
				};
				await db.setItem(newConversation.id, newConversation);
			},
			async setLastMessageId(id: string) {
				const conversation = get(_currentConversation)!;
				const newConversation = {
					...conversation,
					lastMessageId: id
				};
				await db.setItem(newConversation.id, newConversation);
			}
		}
	}

	return {
		initialized: db.initialized,
		list: db.list,
		get: getConversation,
		create: createConversation,
		duplicate: duplicateConversation,
		delete: deleteConversation,
		events: eventTarget
	}
}

export function createFolderStore(database: string, table: string, conversationList: Readable<StubDB<ConversationStub>>, conversationEvents: EventTarget ): FolderStore {
	const initialFolderValue = {
		name: '/',
		folders: [],
		conversations: []
	};

	const rawFolderStore = createItemStore<Folder>(
		database,
		table,
		table,
		initialFolderValue
	);

	function findFolder(start: Folder, path: string[]): Folder {
		return path.reduce(
			(curDir, searchPath): Folder => {
				const res = curDir.folders.find((dir) => dir.name === searchPath);
				return res ?? throwError('Folder not found');
			},
			{ folders: [start] } as Folder
		);
	}

	function findConversationFolder(start: Folder, conversationId: string): Folder | null {
		if (start.conversations.includes(conversationId)) {
			return start;
		}
		for (const folder of start.folders) {
			const result = findConversationFolder(folder, conversationId);
			if (result !== null) {
				return result;
			}
		}
		return null;
	}

	conversationEvents.addEventListener("clone", (e: CustomEvent<{ orig: string, clone: string }>) => {
		const {orig, clone}= e.detail;
		rawFolderStore.update((root) => {
			const folder = findConversationFolder(root, orig)!;
			folder.conversations = [...folder.conversations, clone];
			return root;
		});
	});
	conversationEvents.addEventListener("create", (e: CustomEvent<string>) => {
		const id = e.detail;
		rawFolderStore.update((root) => {
			root.conversations = [...root.conversations, id];
			return root;
		});
	});
	conversationEvents.addEventListener("delete", (e: CustomEvent<string>) => {
		const id = e.detail;
		rawFolderStore.update((root) => {
			const folder = findConversationFolder(root, id)!;
			folder.conversations = folder.conversations.filter((it) => it !== id);
			return root;
		});
	});

	const folderStore = derived(
		[rawFolderStore, conversationList],
		([$rawFolderStore, $allConversations]) => {
			function resolveFolder(folder: Folder, parents: Folder[]): ResolvedFolder {
				const folderPath = [...parents, folder];
				const path = folderPath.map((it) => it.name);
				const id = path.join('/');
				const contents: FolderContent[] = [
					...folder.folders.map((it) => {
						const sub = resolveFolder(it, folderPath);
						return {
							id: sub.id,
							path: path,
							type: 'folder',
							item: sub
						} as FolderContent;
					}),
					...folder.conversations.filter(it => $allConversations[it]).map((it) => {
						return {
							id: it,
							type: 'conversation',
							path,
							item: $allConversations[it]
						} as FolderContent;
					})
				];

				return {
					id,
					contents,
					path,
					name: folder.name
				};
			}

			if (Object.keys($allConversations).length == 0) {
				return resolveFolder(initialFolderValue, []);
			} else {
				return resolveFolder($rawFolderStore, []);
			}
		}


	);

	return {
		...folderStore,
		raw: rawFolderStore,
		addFolder(parent: ResolvedFolder, name: string) {
			rawFolderStore.update((folder) => {
				console.log(parent);
				const parentFolder = findFolder(folder, parent.path);
				parentFolder.folders.push({
					name: name,
					folders: [],
					conversations: []
				});
				return folder;
			});
		},
		moveItemToFolder(item: FolderContent, target: ResolvedFolder) {
			rawFolderStore.update((root) => {
				const targetFolder = findFolder(root, target.path);
				const sourceFolder = findFolder(root, item.path);

				if (item.type === 'conversation') {
					sourceFolder.conversations = sourceFolder.conversations.filter((it) => it !== item.id);
					targetFolder.conversations = [...targetFolder.conversations, item.id];
				} else {
					const folder: Folder = findFolder(sourceFolder, [
						sourceFolder.name,
						(item.item as ResolvedFolder).name
					]);
					sourceFolder.folders = sourceFolder.folders.filter(
						(it) => it.name !== (item.item as ResolvedFolder).name
					);
					targetFolder.folders = [...targetFolder.folders, folder];
				}

				return root;
			});
		},
		removeFolder(target: ResolvedFolder) {
			rawFolderStore.update((root) => {
				const sourceFolder = findFolder(root, target.path.slice(0, -1));
				sourceFolder.folders = sourceFolder.folders.filter((it) => it.name !== target.name);
				return root;
			});
		},
		renameFolder(target: ResolvedFolder, newName: string) {
			rawFolderStore.update((root) => {
				const sourceFolder = findFolder(root, target.path);
				sourceFolder.name = newName;
				return root;
			});
		}
	}
}

const conversationStore = createConversationsRepository('technologic', 'conversations');
const folderStore = createFolderStore('technologic', 'folders', conversationStore.list, conversationStore.events);

async function dumpDatabase(){
	const conversations = localforage.createInstance({
		name: 'technologic',
		storeName: 'conversations',
		driver: localforage.INDEXEDDB
	});

	const dump = {
		folders: get(folderStore.raw),
		conversations: {},
	}

	await conversations.iterate((value, key) => {
		dump.conversations[key] = value;
	})

	return dump;
}

async function loadDatabase(dump){
	const conversations = localforage.createInstance({
		name: 'technologic',
		storeName: 'conversations',
		driver: localforage.INDEXEDDB
	});

	await conversations.clear();
	await folderStore.raw.set(dump.folders);
	for (const key of Object.keys(dump.conversations)) {
		await conversations.setItem(key, dump.conversations[key]);
	}
}

export {
	dumpDatabase,
	loadDatabase,
	configStore,
	currentBackend,
	conversationStore,
	folderStore
};
