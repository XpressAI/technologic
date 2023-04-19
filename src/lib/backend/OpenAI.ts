import type {BackendConfiguration} from "../stores/schema";
import type {Backend, Message} from "./types";



export function createBackend(configuration: BackendConfiguration, model: string): Backend {
    const temperature = 0.7;

    function request(payload: any){
        return fetch(`${configuration.url}/chat/completions`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${configuration.token}`
            }
        });
    }

    async function sendMessage(history: Message[]): Promise<Message> {
        const payload = {
            model: model,
            temperature: temperature,
            messages: history
        };

        const response = await request(payload);

        const out = await response.json();
        return out.choices[0].message;
    }

    async function sendMessageAndStream(history: Message[], onMessage: (message: string, done: boolean) => Promise<void>) {
        const payload = {
            model: model,
            temperature: temperature,
            messages: history,
            stream: true
        };

        const response = await request(payload);

        const reader = response.body?.getReader();
        if (!reader) { throw new Error('Could not get reader from response body'); }

        const decoder = new TextDecoder('utf-8');
        let out = '';
        while (true) {
            const {done, value} = await reader.read();
            if (done) {
                break;
            }
            const chunk = decoder.decode(value, {stream: true});
            out += chunk;

            let eventSeparatorIndex;
            while ((eventSeparatorIndex = out.indexOf('\n\n')) !== -1) {
                const data = out.slice(0, eventSeparatorIndex);

                if(data.match(/^data: \[DONE\]/)){
                    await onMessage("", true); // send end message.
                    return;
                }

                const event = JSON.parse(data.replace(/^data: /, ''));

                out = out.slice(eventSeparatorIndex + 2);

                if (event.choices[0].finish_reason === 'stop') {
                    await onMessage("", true); // send end message.
                } else if (event.choices[0].role === 'assistant') {
                    await onMessage("", false); // send start message.
                } else {
                    await onMessage(event.choices[0].delta.content, false);
                }
            }
        }
    }

    return {
        sendMessage,
        sendMessageAndStream
    }
}
