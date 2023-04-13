import {createItemStore} from "./utils";

interface Backend {
    name: string;
    url: string;
    token?: string;
    models: string[];
    defaultModel: string;
}

interface Configuration {
    backends: Backend[]
}

function defaultBackends(): Backend[] {
    return [
        {
            name: "OpenAI",
            url: "https://api.openai.com/v1",
            models: ["gpt-3.5-turbo"],
            defaultModel: "gpt-3.5-turbo",
            token: "YOUR_TOKEN_HERE"
        },
        {
            name: "xpress.ai",
            url: "http://100.82.217.33:5000/v1",
            models: ['rwkv-raven-14b-eng-more'],
            defaultModel: 'rwkv-raven-14b-eng-more',
            token: "YOUR_TOKEN_HERE"
        }
    ]
}

export const configStore = createItemStore<Configuration>("technologic", "config", "config",
    {
        backends: defaultBackends()
    }
);
