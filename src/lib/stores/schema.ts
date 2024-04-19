import type { Message } from '$lib/backend/types';
import type {Readable, Writable} from "svelte/store";

export interface BackendConfiguration {
	api: string;
	name: string;
	url: string;
	token?: string;
	models: string[];
	defaultModel: string;
}

export interface CurrentBackend {
	name: string;
	model: string;
}

export interface Configuration {
	backends: BackendConfiguration[];
	backend: CurrentBackend;
	//// factories: { [factoryName: string]: (configuration: BackendConfiguration, model: string) => Backend }
}

export interface Folder {
	name: string;
	folders: Folder[];
	conversations: string[];
}

export interface FolderContent {
	type: 'folder' | 'conversation';
	id: string;
	path: string[];
	item: ResolvedFolder | ConversationStub;
}

export interface ResolvedFolder {
	id: string;
	name: string;
	path: string[];
	contents: FolderContent[];
}

export interface MessageSource {
	backend: string;
	model: string;
}

export interface MessageContainer {
	id: string;
	message: Message;
	isStreaming: boolean;
	source?: MessageSource;
}

interface MessageKV {
	[id: string]: MessageContainer;
}

export interface Link {
	from?: string;
	to: string;
}

export interface Conversation {
	id: string;
	title: string;
	messages: MessageKV;
	graph: Link[];
	lastMessageId?: string;
	isUntitled: boolean;
}

export interface MessageAlternative {
	self: string;
	messageIds: string[];
}

export interface MessageThread {
	messages: MessageAlternative[];
}

export interface ConversationDB {
	[id: string]: ConversationStub;
}

export interface ConversationStub {
	id: string;
	title: string;
}

export interface FolderStore extends Readable<ResolvedFolder> {
	raw: Writable<Folder>;
	moveItemToFolder(item: FolderContent, target: ResolvedFolder): void;
	renameFolder(target: ResolvedFolder, newName: string): void;
	addFolder(parent: ResolvedFolder, name: string): void;
	removeFolder(target: ResolvedFolder): void
}

export interface ConversationStore extends Readable<Conversation | null> {
	messageThread: Readable<MessageThread>;
	history: Readable<Message[]>;
	setLastMessageId(id: string): void;
	selectMessageThreadThrough(message: MessageContainer): Promise<void>;
	rename(title: string): Promise<void>;
	addMessage(msg: Message, source: MessageSource, isStreaming: boolean, parentMessageId?: string): Promise<MessageContainer>
	replaceMessage(orig: MessageContainer, newMsg: MessageContainer): Promise<MessageContainer>;
	deleteMessage(orig: MessageContainer): Promise<void>;
}

export interface StubDB<R> {
	[key: string]: R;
}

export interface ConversationsRepository {
	initialized: Writable<boolean>;
	list: Writable<StubDB<ConversationStub>>;
	get: (conversationId: string) => ConversationStore;
	create: () => Promise<ConversationStore>;
	duplicate: (conversationId: string) => Promise<ConversationStore>;
	delete: (conversationId: string) => Promise<void>;
	events: EventTarget
}
