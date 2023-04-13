import {writable, get, derived} from "svelte/store";
import type {Readable} from "svelte/store";
import localforage from "localforage";
import type {Message} from "$lib/OpenAI";
import {page} from "$app/stores";
import {folderStore} from "./folderStore";
import {browser} from "$app/environment";

interface MessageSource {
    backend: string,
    model: string
}

interface MessageContainer {
    id: string,
    message: Message,
    isStreaming: boolean,
    source?: MessageSource
}

interface MessageKV {
    [id: string]: MessageContainer
}

interface Link {
    from?: string,
    to: string
}

interface Conversation {
    id: string
    title: string,
    messages: MessageKV,
    graph: Link[],
    lastMessageId?: string
}

interface MessageAlternative {
    self: string
    messageIds: string[]
}

interface MessageThread {
    messages: MessageAlternative[],
}

interface ConversationDB {
    [id: string]: ConversationStub
}

interface ConversationStub {
    id: string,
    title: string
}

export function createConversationStore(database: string, table: string) {
    const allConversations = writable<ConversationDB>({});
    const currentConversation = writable<Conversation | null>(null);
    const currentMessageThread: Readable<MessageThread> = derived(currentConversation, ($currentConversation) => {
        const messages: MessageAlternative[] = [];
        if($currentConversation !== null){
            const lastMessageId = $currentConversation.lastMessageId;

            if(lastMessageId !== undefined){
                let currentMessageId: string | undefined = lastMessageId;
                while(currentMessageId !== undefined){
                    const parentMessageId = $currentConversation.graph.find(it => it.to === currentMessageId)?.from;
                    const siblingMessageIds = $currentConversation.graph.filter(it => it.from === parentMessageId)
                    messages.unshift({
                        self: currentMessageId,
                        messageIds: siblingMessageIds?.map(it => it.to) ?? []
                    })
                    currentMessageId = parentMessageId;
                }
            }
        }

        return {
            messages: messages,
        } as MessageThread;
    })

    let db: LocalForage;
    let ready: Promise<void>;

    async function updateAllConversations(){
        await ready;
        const newValue: ConversationDB = {}
        await db.iterate((value: Conversation, key) => {
            newValue[key] = {
                id: value.id,
                title: value.title
            };
        });
        allConversations.set(newValue);
    }
    async function addMessage(msg: Message, source: MessageSource){
        const $currentConversation = get(currentConversation);

        const container: MessageContainer = {
            id: Object.keys($currentConversation?.messages ?? {}).length.toString(),
            source: source,
            isStreaming: false,
            message: msg
        }

        let newConversation: Conversation;
        if($currentConversation !== null){
            newConversation = {
                ...$currentConversation,
                messages: {
                    ...$currentConversation.messages,
                    [container.id]: container
                },
                graph: [...$currentConversation.graph, {from: $currentConversation.lastMessageId, to: container.id}],
                lastMessageId: container.id
            }
            await db.setItem(newConversation.id, newConversation);
        }else{
            newConversation = {
                id: (await db.keys()).length.toString(),
                title: "New Conversation",
                messages: {
                    [container.id]: container
                },
                graph: [{from: undefined, to: container.id}],
                lastMessageId: container.id
            }
            await db.setItem(newConversation.id, newConversation);
            await updateAllConversations();

            folderStore.update((folder) => {
                return {
                    ...folder,
                    conversations: [...folder.conversations, newConversation.id]
                }
            });
        }
        currentConversation.set(newConversation);
    }

    if(browser){
        db = localforage.createInstance({
            name: database,
            storeName: table,
            driver: localforage.INDEXEDDB
        });

        const ready = db.ready();
        ready.then(updateAllConversations);

        page.subscribe(async (page) => {
            const conversationId = page.params?.conversationId;
            if(conversationId){
                await ready;

                const conversation = await db.getItem<Conversation>(conversationId);
                currentConversation.set(conversation);
            }
        });
    }

    return {
        currentConversation,
        currentMessageThread,
        allConversations,
        addMessage
    }
}

export const {
    currentConversation,
    currentMessageThread,
    allConversations,
    addMessage
} = createConversationStore("technologic", "conversations");
