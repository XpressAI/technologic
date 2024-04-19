import type { BackendConfiguration } from "$lib/stores/schema";
import type { ConversationStore } from "$lib/stores/schema";

export interface Message {
	role: string;
	content: string;
	name?: string;
}

export interface Backend {
	readonly api: string;
	readonly name: string;
	readonly model: string;
	readonly temperature: number;

	sendMessage(history: Message[]): Promise<Message>;
	sendMessageAndStream(
		history: Message[],
		onMessage: (message: string, done: boolean) => Promise<void>
	): Promise<void>;
	renameConversationWithSummary(currentConversation: ConversationStore): Promise<void>;
}

export interface BackendFactory {
	createBackend(configuration: BackendConfiguration, model: string): Backend;
}
