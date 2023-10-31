import type {ConversationStore} from "$lib/stores/schema";
import type {Backend, Message} from "$lib/backend/types";
import {get} from "svelte/store";
import {renderToolInstructions, renderToolSelectionInstructions, tools} from "$lib/tools";
import type {ToolCall, ToolSpec} from "$lib/tools/types";
import * as vecto  from '@xpressai/vecto-client';
import { env } from '$env/dynamic/public';

const vecto_index = new vecto.IndexApi(new vecto.Configuration({
  accessToken: env["VECTO_API_KEY"]
}));

const vecto_lookup = new vecto.LookupApi(new vecto.Configuration({
  accessToken: env["VECTO_API_KEY"]
}));


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
       const recalled_context = await recallContext(history, backend);
       if (recalled_context) {
         history = [...history, {role: 'system', content: recalled_context}];
       }
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
            if (done) {
              await rememberContext(get(currentConversation.history), backend);
            }
    });



}

async function rememberContext(history: Message[], backend: Backend) {
  // Summarize the last user message and assistant response and save to vecto.
  const lastUserMessage = history.findLast((msg) => msg.role === 'user');
  const lastAssistantMessage = history.findLast((msg) => msg.role === 'assistant');
  const summaryMessage = { role: 'system', content: 'You are a summarizer bot.  Given this list of messages provide a summary of what has been discussed.'};

  if (lastUserMessage && lastAssistantMessage) {
    const summary = await backend.sendMessage([
      summaryMessage,
      lastUserMessage,
      lastAssistantMessage
    ]);

    const res = await vecto_index.indexData({
      vectorSpaceId: 28477,
      modality: 'TEXT',
      attributes: [JSON.stringify({summary: summary.content})],
      input: [new Blob([summary.content])],
    });

    console.log(res);
  }
  return '';
}


async function recallContext(history: Message[], backend: Backend) {
  // Summarize the last user message and assistant response and save to vecto.
  const lastUserMessage = history.findLast((msg) => msg.role === 'user');
  const summaryMessage = { role: 'system', content: 'You are a summarizer bot.  Given this list of messages provide a summary of what is being discussed.'};

  if (lastUserMessage) {
    const summary = await backend.sendMessage([
      summaryMessage,
      lastUserMessage,
    ]);

    const res = await vecto_lookup.lookup({
      vectorSpaceId: 28477,
      modality: 'TEXT',
      topK: 3,
      query: new Blob([summary.content]),
    });

    console.log(res);
    return 'This is the information you recall from previous conversations with this user: ' + JSON.stringify(res.results);
  }
  return '';
}