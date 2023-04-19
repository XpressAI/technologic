export interface Message {
    role: string;
    content: string;
}

export interface Backend {
    sendMessage(history: Message[]): Promise<Message>;
    sendMessageAndStream(history: Message[], onMessage: (message: string, done: boolean) => Promise<void>): Promise<void>;
}
