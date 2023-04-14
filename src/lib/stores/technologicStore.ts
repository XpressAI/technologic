import { storage } from 'svelte-legos';
import { derived, get, writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
import type { Message } from '$lib/OpenAI';
import { page } from '$app/stores';

interface MessageContainer {
	id: string;
	parentId?: string;
	message: Message;
}

interface MessageHolder {
	[id: string]: MessageContainer;
}

interface MessageDB {
	nextId: number;
	messages: MessageHolder;
}

interface Conversation {
	id: string;
	title: string;
	lastMessage?: MessageContainer;
}

interface ConversationHolder {
	[id: string]: Conversation;
}

interface ConversationDB {
	nextId: number;
	conversations: ConversationHolder;
}

interface TechnologicDB {
	conversations: ConversationDB;
	messages: MessageDB;
}

export function technologicStore() {
	const baseStore = storage(
		writable<TechnologicDB>({
			conversations: {
				nextId: 0,
				conversations: {}
			},
			messages: {
				nextId: 0,
				messages: {}
			}
		}),
		'technologic'
	);

	function getConversationMessages(
		$conversation: Conversation,
		$messages: MessageHolder
	): MessageContainer[] {
		const out: MessageContainer[] = [];
		if ($conversation === undefined) return out;

		let currentMessage = $conversation.lastMessage;
		while (currentMessage !== undefined) {
			out.push(currentMessage);
			if (currentMessage.parentId !== undefined) {
				currentMessage = $messages[currentMessage.parentId];
			} else {
				currentMessage = undefined;
			}
		}

		out.reverse();

		return out;
	}

	const conversations = derived(baseStore, (value) => value.conversations.conversations);
	const messages = derived(baseStore, (value) => value.messages.messages);
	const currentConversation: Readable<Conversation> = derived(
		[conversations, page],
		([$conversations, $page]) => $conversations[$page.params['conversationId']]
	);
	const currentMessages: Readable<MessageContainer[]> = derived(
		[messages, currentConversation],
		([$messages, $conversation]) => {
			const out = getConversationMessages($conversation, $messages);
			return out;
		},
		[]
	);

	function createConversation(id: string) {
		baseStore.update((db: TechnologicDB): TechnologicDB => {
			const nextId = db.conversations.nextId + 1;

			return {
				conversations: {
					nextId,
					conversations: {
						...db.conversations.conversations,
						[id]: {
							id: id,
							title: 'Conversation ' + id,
							lastMessage: undefined
						}
					}
				},
				messages: db.messages
			};
		});
	}

	function addMessage(conv: Conversation, message: Message) {
		baseStore.update((db: TechnologicDB): TechnologicDB => {
			const id = db.messages.nextId.toString();
			const nextId = db.messages.nextId + 1;

			const messageContainer: MessageContainer = {
				id,
				parentId: conv === undefined ? undefined : conv.lastMessage?.id,
				message
			};

			const updatedConv: Conversation = {
				...conv,
				lastMessage: messageContainer
			};

			return {
				conversations: {
					nextId: db.conversations.nextId,
					conversations: {
						...db.conversations.conversations,
						[updatedConv.id]: updatedConv
					}
				},
				messages: {
					nextId,
					messages: {
						...db.messages.messages,
						[id]: messageContainer
					}
				}
			};
		});
	}

	function forkConversation(conv: Conversation, messageContainer: MessageContainer) {
		baseStore.update((db: TechnologicDB): TechnologicDB => {
			return {
				conversations: {
					nextId: db.conversations.nextId + 1,
					conversations: {
						...db.conversations.conversations,
						[db.conversations.nextId.toString()]: {
							id: db.conversations.nextId.toString(),
							title: conv.title + ' (forked)',
							lastMessage: messageContainer
						}
					}
				},
				messages: db.messages
			};
		});
	}

	function renameConversation(conv: Conversation, title: string) {
		baseStore.update((db: TechnologicDB): TechnologicDB => {
			return {
				conversations: {
					nextId: db.conversations.nextId,
					conversations: {
						...db.conversations.conversations,
						[conv.id]: {
							...conv,
							title
						}
					}
				},
				messages: db.messages
			};
		});
	}

	return {
		conversations,
		messages,
		currentConversation,
		currentMessages,
		addMessage,
		createConversation,
		forkConversation,
		renameConversation,
		getConversationMessages
	};
}

export const technologic = technologicStore();
