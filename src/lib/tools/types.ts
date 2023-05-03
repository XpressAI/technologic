import type {Message} from "$lib/backend/types";

export interface ExampleSpec {
    input: string,
    output: string
}

export interface ArgumentSpec {
    name: string,
    doc: string
}

export interface ToolCall {
    method: string,
    arguments: string[]
}

export interface MethodSpec {
    name: string,
    arguments: ArgumentSpec[],
    explanation: string,
    examples: ExampleSpec[],
    exec?: (toolSpec: ToolCall) => Promise<Message>
}

export interface ToolSpec {
    name: string,
    explanation: string,
    methods?: MethodSpec[]
}
