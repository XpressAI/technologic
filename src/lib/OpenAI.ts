import {PUBLIC_MODEL} from '$env/static/public';

export interface Message {
	role: string;
	content: string;
}

export async function sendMessage(message: Message, history: Message[]) {
	const model = PUBLIC_MODEL;
	const temperature = 0.7;

	const payload = {
		model: model,
		temperature: temperature,
		messages: [...history, message]
	};

	const response = await fetch('/v1/chat/completions', {
		method: 'POST',
		body: JSON.stringify(payload),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	const out = await response.json();
	return out.choices[0].message;
}

export async function sendMessageAndStream(message: Message, history: Message[], onMessage: (message: string, done: boolean) => void) {
    const model = PUBLIC_MODEL;
    const temperature = 0.7;

    const payload = {
        model: model,
        temperature: temperature,
        messages: [...history],
        stream: true
    };

    const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const reader = response.body.getReader();
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

            const event = JSON.parse(data.replace(/^data: /, ''));

            out = out.slice(eventSeparatorIndex + 2);

            if (event.choices[0].finish_reason === 'stop') {
                console.log("End")
                onMessage("", true); // send end message.
            } else if (event.choices[0].role === 'assistant') {
                console.log("Role")
                onMessage("", false); // send start message.
            } else {
                console.log("content: " + event.choices[0].delta.content);
                onMessage(event.choices[0].delta.content, false);
            }
        }
    }
}
