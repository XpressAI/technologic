export interface Message {
	role: string;
	content: string;
	name?: string;
}

export interface Backend {
	readonly name: string;
	readonly model: string;
	readonly temperature: number;

	request(payload: unknown): Promise<Response>,
	sendMessage(history: Message[]): Promise<Message>;
	sendMessageAndStream(
		history: Message[],
		onMessage: (message: string, done: boolean) => Promise<void>
	): Promise<void>;
}
