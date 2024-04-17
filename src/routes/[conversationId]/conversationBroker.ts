import type {ConversationStore} from "$lib/stores/schema";
import type {Backend, Message} from "$lib/backend/types";
import {get} from "svelte/store";
import { renameConversationWithSummary as conversationSummaryOpenAI } from "../../lib/backend/OpenAI";
import { renameConversationWithSummary as conversationSummaryAnthropic } from "../../lib/backend/Anthropic";

export async function renameConversationWithSummary(currentConversation: ConversationStore, backend: Backend) {
    switch (backend.api) {
        case 'anthropic':
            return await conversationSummaryAnthropic(currentConversation, backend);

        case 'openai':
        default:
            return await conversationSummaryOpenAI(currentConversation, backend);

    }
}

export async function generateAnswer(currentConversation: ConversationStore, backend: Backend){
    const history = get(currentConversation.history);

    const source = { backend: backend.name, model: backend.model };

    let responseMessage = await currentConversation.addMessage({role: 'assistant', content: ''}, source, true, get(currentConversation)!.lastMessageId);
    await backend.sendMessageAndStream(history, async (content, done) => {
            responseMessage = await currentConversation.replaceMessage(
                responseMessage,
                {
                    ...responseMessage,
                    isStreaming: !done,
                    message: {
                    ...responseMessage.message,
                    content: responseMessage.message.content + (content ?? '')
                    }
                },
            );

            if (done && get(currentConversation)?.isUntitled) {
                await renameConversationWithSummary(currentConversation, backend);
            }
    });
}
