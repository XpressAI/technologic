import { writable, get, derived } from 'svelte/store';
import type { Readable } from 'svelte/store';
import localforage from 'localforage';
import type { Message } from '$lib/OpenAI';
import { page } from '$app/stores';
import { browser } from '$app/environment';
import type {
	Backend,
	Configuration,
	Conversation,
	ConversationDB,
	Folder,
	FolderContent,
	MessageAlternative,
	MessageContainer,
	MessageSource,
	MessageThread,
	ResolvedFolder
} from './schema';
import { createItemStore } from './utils';
import { throwError } from 'svelte-preprocess/dist/modules/errors';

function defaultBackends(): Backend[] {
	return [
		{
			name: 'OpenAI',
			url: 'https://api.openai.com/v1',
			models: ['gpt-3.5-turbo'],
			defaultModel: 'gpt-3.5-turbo',
			token: 'YOUR_TOKEN_HERE'
		},
		{
			name: 'xpress.ai',
			url: 'http://100.82.217.33:5000/v1',
			models: ['rwkv-raven-14b-eng-more'],
			defaultModel: 'rwkv-raven-14b-eng-more',
			token: 'YOUR_TOKEN_HERE'
		}
	];
}

const configStore = createItemStore<Configuration>('technologic', 'config', 'config', {
	backends: defaultBackends()
});

const initialFolderValue = {
	name: '/',
	folders: [],
	conversations: []
};

const rawFolderStore = createItemStore<Folder>(
	'technologic',
	'folders',
	'folders',
	initialFolderValue
);

export function createConversationStore(database: string, table: string) {
	const allConversations = writable<ConversationDB>({});
	const currentConversation = writable<Conversation | null>(null);
	const currentMessageThread: Readable<MessageThread> = derived(
		currentConversation,
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

	let db: LocalForage;
	let ready: Promise<void>;

	async function updateAllConversations() {
		await ready;
		const newValue: ConversationDB = {};
		await db.iterate((value: Conversation, key) => {
			newValue[key] = {
				id: value.id,
				title: value.title
			};
		});
		allConversations.set(newValue);
	}
	async function addMessage(msg: Message, source: MessageSource) {
		const $currentConversation = get(currentConversation);

		const container: MessageContainer = {
			id: Object.keys($currentConversation?.messages ?? {}).length.toString(),
			source: source,
			isStreaming: false,
			message: msg
		};

		let newConversation: Conversation;
		if ($currentConversation !== null) {
			newConversation = {
				...$currentConversation,
				messages: {
					...$currentConversation.messages,
					[container.id]: container
				},
				graph: [
					...$currentConversation.graph,
					{ from: $currentConversation.lastMessageId, to: container.id }
				],
				lastMessageId: container.id
			};
			await db.setItem(newConversation.id, newConversation);
		} else {
			newConversation = {
				id: (await db.keys()).length.toString(),
				title: 'New Conversation',
				messages: {
					[container.id]: container
				},
				graph: [{ from: undefined, to: container.id }],
				lastMessageId: container.id
			};
			await db.setItem(newConversation.id, newConversation);
			await updateAllConversations();

			rawFolderStore.update((folder) => {
				return {
					...folder,
					conversations: [...folder.conversations, newConversation.id]
				};
			});
		}
		currentConversation.set(newConversation);
	}

	async function renameConversation(title: string) {
		const $currentConversation = get(currentConversation);
		let newConversation: Conversation;
		if ($currentConversation !== null) {
			newConversation = {
				...$currentConversation,
				title: title
			};
			await db.setItem(newConversation.id, newConversation);
		} else {
			newConversation = {
				id: (await db.keys()).length.toString(),
				title: 'New Conversation',
				messages: {},
				graph: [],
				lastMessageId: undefined
			};
			await db.setItem(newConversation.id, newConversation);
			rawFolderStore.update((folder) => {
				return {
					...folder,
					conversations: [...folder.conversations, newConversation.id]
				};
			});
		}
		await updateAllConversations();
		currentConversation.set(newConversation);
	}

	function findConversationFolder(start: Folder, conv: Conversation): Folder | null {
		if (start.conversations.includes(conv.id)) {
			return start;
		}
		for (const folder of start.folders) {
			const result = findConversationFolder(folder, conv);
			if (result !== null) {
				return result;
			}
		}
		return null;
	}

	async function deleteConversation() {
		const $currentConversation = get(currentConversation);
		if ($currentConversation !== null) {
			await db.removeItem($currentConversation.id);
			rawFolderStore.update((root) => {
				const folder = findConversationFolder(root, $currentConversation);
				if(folder){
					folder.conversations = folder.conversations.filter((it) => it !== $currentConversation.id);
				}
				return root;
			});
			await updateAllConversations();
			currentConversation.set(null);
		}
	}

	async function duplicateConversation() {
		const $currentConversation = get(currentConversation);
		if ($currentConversation !== null) {
			const newConversation = {
				...$currentConversation,
				id: (await db.keys()).length.toString(),
				title: $currentConversation.title + ' (copy)'
			};
			await db.setItem(newConversation.id, newConversation);
			await updateAllConversations();
			rawFolderStore.update((root) => {
				const folder = findConversationFolder(root, $currentConversation);
				if(folder){
					folder.conversations = [...folder.conversations, newConversation.id];
				}
				return root;
			});
		}
	}

	if (browser) {
		db = localforage.createInstance({
			name: database,
			storeName: table,
			driver: localforage.INDEXEDDB
		});

		const ready = db.ready();
		ready.then(updateAllConversations);

		page.subscribe(async (page) => {
			const conversationId = page.params?.conversationId;
			if (conversationId) {
				await ready;

				const conversation = await db.getItem<Conversation>(conversationId);
				currentConversation.set(conversation);
			}
		});
	}

	return {
		currentConversation,
		currentMessageThread,
		allConversations,
		addMessage,
		renameConversation,
		deleteConversation,
		duplicateConversation
	};
}

const { currentConversation,
	currentMessageThread,
	allConversations,
	addMessage,
	renameConversation,
	deleteConversation,
	duplicateConversation
} = createConversationStore('technologic', 'conversations');

const folderStore = derived(
	[rawFolderStore, allConversations],
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
				...folder.conversations.map((it) => {
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

function findFolder(start: Folder, path: string[]): Folder {
	return path.reduce(
		(curDir, searchPath): Folder => {
			const res = curDir.folders.find((dir) => dir.name === searchPath);
			return res ?? throwError('Folder not found');
		},
		{ folders: [start] } as Folder
	);
}

function addFolder(parent: ResolvedFolder, name: string) {
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
}

function moveItemToFolder(item: FolderContent, target: ResolvedFolder) {
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
}

function removeFolder(target: ResolvedFolder) {
	rawFolderStore.update((root) => {
		const sourceFolder = findFolder(root, target.path.slice(0, -1));
		sourceFolder.folders = sourceFolder.folders.filter((it) => it.name !== target.name);
		return root;
	});
}

function renameFolder(target: ResolvedFolder, newName: string) {
	rawFolderStore.update((root) => {
		const sourceFolder = findFolder(root, target.path);
		sourceFolder.name = newName;
		return root;
	});
}

export {
	currentConversation,
	currentMessageThread,
	allConversations,
	folderStore,
	configStore,
	addMessage,
	addFolder,
	moveItemToFolder,
	removeFolder,
	renameFolder,
	renameConversation,
	deleteConversation,
	duplicateConversation
};