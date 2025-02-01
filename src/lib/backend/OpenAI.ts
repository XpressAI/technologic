import type { BackendConfiguration } from '$lib/stores/schema';
import type { Backend, Message } from '$lib/backend/types';
import type { ConversationStore } from "$lib/stores/schema";
import {get} from "svelte/store";
import type { BackendFactory } from "./types";

export const openAIBackendFactory: BackendFactory = {
	createBackend
};

export function createBackend(configuration: BackendConfiguration, model: string): Backend {
	const temperature = 0.7;

	function request(payload: any) {
		let baseUrl = configuration.url;
		if(baseUrl.startsWith("http://0.0.0.0")){
			baseUrl = "";
		}
		return fetch(`${baseUrl}/chat/completions`, {
			method: 'POST',
			body: JSON.stringify(payload),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${configuration.token}`
			}
		});
	}

	async function sendMessage(history: Message[]): Promise<Message> {
    if (model.startsWith('o1') || model.startsWith('o3')) {
      const payload = {
        model: model,
        reasoning_effort: 'medium',
        response_format: {
          type: 'text'
        },
        messages: history
      };
      const response = await request(payload);

      const out = await response.json();
      return out.choices[0].message;
    } else {
      const payload = {
        model: model,
        temperature: temperature,
        messages: history
      };
      const response = await request(payload);

      const out = await response.json();
      return out.choices[0].message;
    }
	}

	async function sendMessageAndStream(
		history: Message[],
		onMessage: (message: string, done: boolean) => Promise<void>
	) {
    let payload = null;

    if (model.startsWith('o1') || model.startsWith('o3')) {
      payload = {
        model: model,
        reasoning_effort: 'medium',
        response_format: {
          type: 'text'
        },
        messages: history,
        stream: true
      };
    } else {
      payload = {
        model: model,
        temperature: temperature,
        messages: history,
        stream: true
      };
    }

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

        const event = JSON.parse(data.replace(/^data: /, ''));

        out = out.slice(eventSeparatorIndex + 2);

        if (event.choices[0].finish_reason === 'stop') {
          await onMessage('', true); // send end message.
        } else if (event.choices[0].role === 'assistant') {
          await onMessage('', false); // send start message.
        } else {
          await onMessage(event.choices[0].delta.content, false);
        }
      }
    }
	}

  function escapeHtml(unsafeText: string) {
    const div = document.createElement('div');
    div.textContent = unsafeText;
    return div.innerHTML;
  }

  function limitTitle(title: string) {
    const words = title.split(' ');
    if (words.length <= 7) {
      return title;
    }
    return words.slice(0, 7).join(' ') + '...';
  }

	async function renameConversationWithSummary(currentConversation: ConversationStore) {
		const summarizeMessage = 'Using the same language, in at most 7 words summarize the conversation between assistant and user before this message to serve as a title.  Respond with ONLY the summary, no other commentary or acknowledgements of this instruction.'

		const systemMessage: Message = {
			role: 'system',
			content: summarizeMessage,
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
		const newTitle = limitTitle(escapeHtml(response.content.replace(/<think>[\s\S]*?<\/think>/g, '')));
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
