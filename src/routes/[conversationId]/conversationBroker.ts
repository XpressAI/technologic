import type {ConversationStore} from "$lib/stores/schema";
import type {Backend, Message} from "$lib/backend/types";
import {get} from "svelte/store";
import {renderToolInstructions, renderToolSelectionInstructions, toolApi} from "$lib/tools";
import type {ToolCall, ToolSpec} from "$lib/tools/types";
import {toolStore} from "$lib/stores/technologicStores";

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

async function chooseTool(message: Message, backend: Backend){
    const activeTools = toolStore.activeTools();

    const toolSelectionPrompt = {
        role: 'system',
        content: renderToolSelectionInstructions(activeTools) + "\n\n --- \n\n The User's query is: \n```" + message.content + "```"
    };
    console.trace("Tool Selection Prompt", toolSelectionPrompt.content)
    const response = await backend.request({
        model: backend.model,
        temperature: backend.temperature,
        messages: [
            toolSelectionPrompt,
        ],
        functions: [
            {
                name: "chooseTool",
                description: "Select a proper tool for the task.",
                parameters: {
                    type: "object",
                    properties: {
                        reason: {
                            type: "string",
                            description: "The reason why you have selected the tool."
                        },
                        toolName: {
                            type: "string",
                            description: "The chosen tool for the given task"
                        }
                    },
                    required: ["reason", "toolName"]
                }
            }
        ],
        function_call: {"name": "chooseTool"}
    })

    let match = null;
    try {
        const json = await response.json()
        console.log("response", json);
        match = JSON.parse(json.choices[0].message.function_call.arguments);
    }catch (e) {
        console.warn("Could not parse response from tool selector.", response, e);
    }
    if(match){
        const selectedTool = match.toolName;
        console.info("Selected Tool:", selectedTool, match.reason);

        const tool: ToolSpec | undefined = activeTools.find(tool => tool.name === selectedTool);
        if(tool){
            const toolFn = async () => {
                const toolInstructionPrompt = {
                    role: 'system',
                    content: renderToolInstructions(tool)+ "\n\n --- \n\n The User's query is: ```" + message.content + "```"
                };
                console.trace("Tool Instruction Prompt", toolInstructionPrompt.content);

                const methodResp = await backend.request({
                    model: backend.model,
                    temperature: backend.temperature,
                    messages: [
                        toolInstructionPrompt,
                    ],
                    functions: [
                        {
                            name: "chooseMethod",
                            description: "Select a method for the task.",
                            parameters: {
                                type: "object",
                                properties: {
                                    reason: {
                                        type: "string",
                                        description: "The reason why you have selected the method."
                                    },
                                    methodName: {
                                        type: "string",
                                        description: "The chosen method for the given task"
                                    }
                                },
                                required: ["reason", "methodName"]
                            }
                        }
                    ],
                    function_call: {"name": "chooseMethod"}
                })
                console.log(methodResp);
                const methodResponse = JSON.parse((await methodResp.json()).choices[0].message.function_call.arguments)

                if(tool.methods?.find(it => it.name == methodResponse.methodName) == undefined){
                    console.warn("Couldn't select a method. Reason: " + methodResponse.reason)
                    return;
                }
                const methodName = methodResponse.methodName;


                const response = await backend.request({
                    model: backend.model,
                    temperature: backend.temperature,
                    messages: [
                        toolInstructionPrompt,
                    ],
                    functions: tool.methods?.map(m => { return {
                            name: m.name,
                            description: m.explanation,
                            parameters: {
                                type: "object",
                                properties: Object.assign({}, ...m.arguments.map(a => { return {
                                    [a.name]: {
                                        type: "string",
                                        description: a.doc
                                    }
                                }}))
                            }
                        }}),
                    function_call: {name: methodName}
                })


                const toolResponse = (await response.json()).choices[0].message.function_call
                console.info("Tool Call:", toolResponse)

                try {
                    const method = tool.methods?.find(it => it.name === toolResponse.name)
                    const args: ToolCall  = JSON.parse(toolResponse.arguments)
                    if(method !== undefined && method.fnSrc !== undefined){
                        return await eval(method.fnSrc)(args, {
                            ...toolApi,
                            toolName: tool.name
                        })
                    }else{
                        console.warn("Selected method not in list of methods.", args);
                    }
                }catch (e) {
                    console.warn("Could not parse response from tool.", toolResponse, e);
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


     if(toolStore.activeTools().length > 0 && history.length > 0 && history[history.length - 1].role === 'user'){
        const tool = await chooseTool(history[history.length - 1], backend);
        if(tool){
            const toolOutputMessage = await tool();
            if(toolOutputMessage){
                await currentConversation.addMessage(toolOutputMessage, { backend: tool.toolName, model: 'tool' }, false, get(currentConversation)!.lastMessageId);
            }
        }

        history = get(currentConversation.history);
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
