import type {ConversationStore} from "$lib/stores/schema";
import type {Backend, Message} from "$lib/backend/types";
import {get} from "svelte/store";
import {renderToolInstructions, renderToolSelectionInstructions, tools} from "$lib/tools";
import type {ToolCall, ToolSpec} from "$lib/tools/types";

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

async function chooseTool(messages: Message[], backend: Backend){

    const toolSelectionPrompt = {
        role: 'system',
        content: renderToolSelectionInstructions(tools) + "\n\n --- \n\n The context is: \n```" + JSON.stringify(messages) + "```"
    };
    console.trace("Tool Selection Prompt", toolSelectionPrompt.content)
    const response = await backend.sendMessage([
        toolSelectionPrompt
    ])
    let match = null;
    try {
        match = JSON.parse(response.content);
    }catch (e) {
        console.warn("Could not parse response from tool selector.", response);
    }
    if(match){
        const selectedTool = match.toolName;
        console.info("Selected Tool:", selectedTool)

        const tool: ToolSpec | undefined = tools.find(tool => tool.name === selectedTool);
        if(tool && tool.methods){
            const toolFn = async () => {
                const toolInstructionPrompt = {
                    role: 'system',
                    content: renderToolInstructions(tool)+ "\n\n --- \n\n The context is: ```" + JSON.stringify(messages) + "```"
                };
                console.trace("Tool Instruction Prompt", toolInstructionPrompt.content);

                const toolResponse = await backend.sendMessage([
                    toolInstructionPrompt
                ])

                try {
                    const toolCall: ToolCall  = JSON.parse(toolResponse.content)
                    console.info("Tool Call:", toolCall.method, toolCall.arguments)

                    const method = tool.methods?.find(it => it.name === toolCall.method)
                    if(method !== undefined && method.exec !== undefined){
                        return await method.exec(toolCall)
                    }else{
                        console.warn("Selected method not in list of methods.", toolCall);
                    }
                }catch (e) {
                    console.warn("Could not parse response from tool.", toolResponse);
                }
            }
            toolFn.toolName = selectedTool;
            return toolFn;
        }else{
            console.warn("Selected tool not in list of tools.", response);
        }
    }
}

export async function generateAnswer(currentConversation: ConversationStore, backend: Backend){
     let history = get(currentConversation.history);


     if(history.length > 0 && history[history.length - 1].role === 'user'){
        let tool;
        do {
            tool = await chooseTool(history, backend);
            if(tool){
                const toolOutputMessage = await tool();
                if(toolOutputMessage){
                    await currentConversation.addMessage(toolOutputMessage, { backend: tool.toolName, model: 'tool' }, false, get(currentConversation)!.lastMessageId);
                }
            }
            history = get(currentConversation.history);
        } while(tool);
    }

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
                }
            );

            if (done && get(currentConversation)?.isUntitled) {
                await renameConversationWithSummary(currentConversation, backend);
            }
    });
}
