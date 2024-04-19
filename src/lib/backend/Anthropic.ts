import type { BackendConfiguration } from '$lib/stores/schema';
import type { Backend, Message } from '$lib/backend/types';
import type { ConversationStore } from "$lib/stores/schema";
import {get} from "svelte/store";
import type { BackendFactory } from "./types";

export const anthropicBackendFactory: BackendFactory = {
	createBackend
};

export function createBackend(configuration: BackendConfiguration, model: string): Backend {
	// according to docs: https://docs.anthropic.com/claude/reference/messages_post
	// temperature default is 1.0, I set it to 0.9 to make it slightly less random
	const temperature = 0.9;

	function request(payload: any) {

		let baseUrl = configuration.url;
		if(baseUrl.startsWith("http://0.0.0.0")){
			baseUrl = "";
		}

		const headers = new Headers();
		headers.append('Content-Type', 'application/json');
		headers.append('x-api-key',`${configuration.token}`);
		headers.append('anthropic-version', '2023-06-01');

		return fetch(`${baseUrl}/messages`, {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(payload)
		});
	}

	async function sendMessage(history: Message[]): Promise<Message> {
		const payload = {
			model: model,
			max_tokens: 1024,
			messages: history.filter((h) => h.role !== 'system'),
			system: history.find((h) => h.role == 'system')?.content
		};

		const response = await request(payload);

		const out = await response.json();
		const content = out.content[0];

		return {
			role: out.role,
			content: content.text,
		};
	}

	async function sendMessageAndStream(
		history: Message[],
		onMessage: (message: string, done: boolean) => Promise<void>
	) {
		const payload = {
			model: model,
			max_tokens: 1024,
			temperature: temperature,
			messages: history.filter((h) => h.content.length > 0),
			stream: true
		};

		const response = await request(payload);

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error('Could not get reader from response body');
		}

		const decoder = new TextDecoder('utf-8');
		let out = '';
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}

			const chunk = decoder.decode(value, { stream: true });
			out += chunk;

			let eventSeparatorIndex;
			while ((eventSeparatorIndex = out.indexOf('\n\n')) !== -1) {
				const data = out.slice(0, eventSeparatorIndex);

				if (data.match(/^data: \[DONE\]/)) {
					await onMessage('', true); // send end message.
					return;
				}
				const json = data.match(/data: (.*)/);
				if (json && json.length >= 1) {

					const event = JSON.parse(json[1]);

					out = out.slice(eventSeparatorIndex + 2);

					switch (event.type) {
						// case 'message_start':
						case 'content_block_start':
							await onMessage('', false); // send start message.
							break;

						// case 'content_block_stop':
						case 'message_stop':
							await onMessage('', true); // send end message.
							return;

						case 'content_block_delta':
							await onMessage(event.delta.text, false);
							break;

						case 'message_delta':
						case 'ping':
						// ignore
					}
				} else {
					console.warn('no json match foound.');
					await onMessage('', false); // send start message.
					return;
				}
			}
		}
	}

	async function renameConversationWithSummary(currentConversation: ConversationStore) {
		const summarizeMessage = 'Using the same language, in at most 3 words summarize the conversation between assistant and user.'

		const systemMessage: Message = {
			role: 'system',
			content: summarizeMessage
		};

		// system prompt alone might not be enough, specially not with other OpenAI-API-compatible models...
		// therefore we just add a "user" message that is the same as the system prompt, to "trigger" the model
		// to write an "assistant" message to the users request.
		const userMessage: Message = {
			role: 'user',
			content: summarizeMessage,
		};

		const history = get(currentConversation.history);
		const filteredHistory = history.filter((msg) => msg.role === 'user' || msg.role === 'assistant');

		const response = await sendMessage([...filteredHistory, systemMessage, userMessage]);

		const newTitle = response.content;
		if (newTitle) {
			await currentConversation.rename(newTitle);
		}
	}


	return {
		get api() {
			return configuration.api;
		},
		get name() {
			return configuration.name;
		},
		get model() {
			return model;
		},
		get temperature() {
			return temperature;
		},

		sendMessage,
		sendMessageAndStream,
		renameConversationWithSummary
	};
}
