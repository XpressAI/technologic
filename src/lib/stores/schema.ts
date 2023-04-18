import type { Message } from '../OpenAI';

export interface Backend {
	name: string;
	url: string;
	token?: string;
	models: string[];
	defaultModel: string;
}

export interface Configuration {
	backends: Backend[];
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

interface Link {
	from?: string;
	to: string;
}

export interface Conversation {
	id: string;
	title: string;
	messages: MessageKV;
	graph: Link[];
	lastMessageId?: string;
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

interface ConversationStub {
	id: string;
	title: string;
}
