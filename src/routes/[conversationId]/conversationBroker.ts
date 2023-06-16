import type {ConversationStore} from "$lib/stores/schema";
import type {Backend, Message} from "$lib/backend/types";
import {get} from "svelte/store";

export async function renameConversationWithSummary(currentConversation: ConversationStore, backend: Backend) {
    const message: Message = {
        role: 'system',
        content: 'Using the same language, in at most 3 words summarize the conversation between assistant and user.'
    };

    const history = get(currentConversation.history);
    const filteredHistory = history.filter((msg) => msg.role === 'user' || msg.role === 'assistant');

    const response = await backend.sendMessage([...filteredHistory, message]);

    const newTitle = response.content;
    if (newTitle) {
        await currentConversation.rename(newTitle);
    }
}

export async function generateAnswer(currentConversation: ConversationStore, backend: Backend){
    const history = get(currentConversation.history);

    const source = { backend: backend.name, model: backend.model };

    let responseMessage = await currentConversation.addMessage({role: 'assistant', content: ''}, source, get(currentConversation)!.lastMessageId);
    await backend.sendMessageAndStream(history, async (content, done) => {
            responseMessage = await currentConversation.replaceMessage(
                responseMessage,
                {
                    ...responseMessage.message,
                    content: responseMessage.message.content + (content ?? '')
                },
                responseMessage.source!,
            );

            if (done && get(currentConversation)?.isUntitled) {
                await renameConversationWithSummary(currentConversation, backend);
            }
    });
}
