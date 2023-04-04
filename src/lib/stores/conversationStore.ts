import {storage} from "svelte-legos";
import {writable} from "svelte/store";

interface Conversation {
    id: string
    title: string
}

export const conversations = storage(writable<Conversation[]>([]), "conversations");
