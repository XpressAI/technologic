import type { Backend, BackendFactory } from "./types";
import type { BackendConfiguration } from "$lib/stores/schema";
import { openAIBackendFactory } from '$lib/backend/OpenAI';
import { anthropicBackendFactory } from '$lib/backend/Anthropic';

const backends: { [key: string]: BackendFactory } = {
    openai: openAIBackendFactory,
    anthropic: anthropicBackendFactory,
    openchat: openAIBackendFactory, // can use the same API as OpenAI
}

export function createBackend(config: BackendConfiguration, model: string): Backend {
    let backendFactory = backends[config.api];

    if (!backendFactory) {
        console.warn(`No matching backend factory found for api type '${config.api}', using OpenAI API backend instead`);
        backendFactory = backends.openai;
    }

    return backendFactory.createBackend(config, model);
}
