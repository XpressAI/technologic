import type {Message} from "$lib/backend/types";
import type {MethodSpec, ToolCall, ToolSpec} from "$lib/tools/types";



function toolOutput(toolName: string, content: string, prefix?: string, suffix?: string, role = 'system'): Message {
    return {
        role: role,
        content: (prefix ? prefix : `${toolName} Tool Output: \n\n`)+content+(suffix ? suffix : '')
    }
}

function calculatorTool(): ToolSpec {
    const toolName = 'calculator'
    const explanation = 'Solves complicated calculations with precision.'
    const methods: MethodSpec[] = [
        {
            name: 'execute',
            arguments: [{
                name: 'calculation',
                doc: 'The calculation to perform.'
            }],
            explanation: 'Performs the calculation using javascript syntax and outputs the result.',
            examples: [
                {
                    input: '1 + 1',
                    output: '2'
                },
                {
                    input: '1 + 1 * 2',
                    output: '3'
                }
            ],
            exec: async (toolCall: ToolCall) => {
                return toolOutput(
                    toolName,
                    eval(toolCall.arguments[0]),
                    undefined,
                    "\n\nThis is the output of the calculation."
                )
            }
        }
    ]

    return {
        name: toolName,
        explanation: explanation,
        methods: methods
    }
}

function encyclopediaTool(baseURL: string, vectorSpaceId: string, token: string): ToolSpec {
    const toolName = 'encyclopedia'
    const explanation = 'Provides information about a topic.'
    const methods: MethodSpec[] = [
        {
            name: 'query',
            arguments: [{
                name: 'topic',
                doc: 'The topic you want to query for more information.'
            }],
            explanation: 'Queries the encyclopedia for a topic. It produces up to 5 results. Its output is in JSON.',
            examples: [
                {
                    input: '"Constantine III"',
                    output: '[\n{id: 789, similarity: 0.9, attributes: {"text": "Constantine III (Latin: Flavius Claudius Constantinus; died shortly before 18 September 411) was a common Roman soldier who was declared emperor in Roman Britain in 407 and established himself in Gaul. He was recognised as co-emperor of the Roman Empire from 409 until 411.", "title": "Constantine III (Western Roman emperor)", "url": "https://en.wikipedia.org/wiki/Constantine_III_(Western_Roman_emperor)"}}\n]'
                },
                {
                    input: '"Illuminati"',
                    output: `[\n{id: 123, similarity: 0.9, attributes: {"text": "The Illuminati (plural of Latin illuminatus, 'enlightened') is a name given to several groups, both real and fictitious. Historically, the name usually refers to the Bavarian Illuminati, an Enlightenment-era secret society founded on 1 May 1776 in Bavaria, today part of Germany. The society's goals were to oppose superstition, obscurantism, religious influence over public life, and abuses of state power.", "url": "https://en.wikipedia.org/wiki/Illuminati"}}\n]`
                }
            ],
            exec: async (toolCall: ToolCall) => {
                const query = toolCall.arguments[0]

                const data = new FormData();
                data.append('vector_space_id', vectorSpaceId)
                data.append('modality', 'TEXT')
                data.append('top_k', '5')
                data.append('query', new File([new Blob([query])], '_'))

                const result = await fetch(`${baseURL}/api/v0/space/${vectorSpaceId}/lookup`, {
                    method: 'POST',
                    body: data,
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                })
                const json = await result.json()

                const results = json.results


                const output = codeBlock(
                        JSON.stringify(results, (k, v) => v.toFixed ? Number(v.toFixed(3)) : v
                        ), 'json');

                return toolOutput(
                    toolName,
                    output,
                    undefined,
                    "\n\n---\n\n" +
                    "The JSON above is additional context information about the topic that is being discussed. \n"+
                    "Answer the question using only the relevant entries in the context. " +
                    "Do not make a judgement on the quality of the results. " +
                    "You must use only the information provided in the context. If it doesn't answer the question, you say that you don't know." +
                    "You must cite your sources by providing the urls and similarity for every entry you used from the context." +
                    "You must answer in the same language as the original question, but you may use sources in different languages."

                )
            }
        }
    ]

    return {
        name: toolName,
        explanation: explanation,
        methods: methods
    }
}



function codeBlock(content: string, type?: string): string {
    return '```' + (type ? type : '') + '\n' + content + '\n```'
}

export function renderToolInstructions(tool: ToolSpec): string {
    const basePrompt = `You are an AI assistant called "ToolBot".
ToolBot is an intelligent chatbot that is designed to use the tool it is provided.
ToolBot understands the given tool descriptions and APIs. 
Toolbot must choose a method and its arguments from the given tool.  
ToolBot provides the chosen method and its step-by-step reasons formatted as JSON like this:
` + codeBlock(
`{
	// Think step by step and provide a reasoning for what you think would be the best method to use.
	reason: "",
	// Your selected method
	method: "",
	// Your selected method's arguments
	arguments: ["", ""]
}`, 'json') + '\n\n ToolBot always starts its output with `{\n"reason":"` and ends it with `]\n}`. \n\n'

    const instructions = tool.methods?.map((method: MethodSpec) => {
        const header = `## ${method.name} ${method.arguments.map(it => '<'+it.name+'>').join(' ')}\n`
        const explanation = method.explanation + '\n' + 'Arguments: \n' + method.arguments.map(it => '* ' + it.name + ': ' + it.doc).join('\n') + '\n\n'
        const examples = 'Examples: \n' + method.examples.map(it => `* \`${method.name} ${it.input}\` => \n${codeBlock(it.output)}\n\n`).join('\n') + '\n\n'

        return `${header}${explanation}${method.examples ? examples : ''}`
    }).join('\n\n')

    return basePrompt + instructions
}

export function renderToolSelectionInstructions(tools: ToolSpec[]): string {
    const basePrompt = `
You are "ToolSelector". The following is a list of tools and a description of their utility that are available. You will receive a query from a user. The query is part of a larger conversation that you don't have direct access to. Your responsibility is to select one of the tools to use to resolve the user's query.

You output everything as JSON formatted like the this:
` + codeBlock(`
{
    // Think step by step and provide a reasoning for what you think would be the best tool to use.
	reason: "",
	// Your actual tool selection.
	toolName: ""
}
`, 'json') + `
ToolSelector always starts its output with \`{\n"reason":"\` and ends it with \`"\n}\`. \n\n

---

`
    const toolPrompt = tools.map(tool => `# ${tool.name}\n${tool.explanation}\n`).join('\n\n')

    return basePrompt + toolPrompt
}

export const tools: ToolSpec[] = [
    {
        name: 'more-context-tool',
        explanation: 'Select this tool when you need clarification. A tool that will make the user provide you with more context in the current conversation.',
    },
    {
        name: 'noop',
        explanation: 'A tool that signals that there is no need to use a tool.',
    },
    {
        name: 'no-applicable-tool',
        explanation: 'A tool that signals that you don\'t have a good tool to resolve the query.',
    },
    calculatorTool(),
    encyclopediaTool('https://api.vecto.ai', '28325', 'f9b71e54-8535-4f05-b6e7-d4d538784c6f')
]
