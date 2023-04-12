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
