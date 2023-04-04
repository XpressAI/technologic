import {storage} from "svelte-legos";
import {derived, writable} from "svelte/store";
import type {Message} from "../OpenAI";
import {page} from "$app/stores";

export function allMessageStore(){
    const {set, subscribe, update} = storage(writable({}), "messages");


    let _conversationId: string;
    return {
        set, subscribe, update,
        setConversationId(conversationId: string){
            _conversationId = conversationId;
        },
        addMessage(message: Message){
            update(origValue => {
                const map = Object.assign({
                    ...origValue
                })

                let messages = []
                if(map[_conversationId] !== undefined){
                    messages = map[_conversationId]
                }
                map[_conversationId] = [...messages, message];

                return map;
            })
        }
    }
}

export const allMessages = allMessageStore();
export const currentMessages = derived([allMessages, page], ([$allMessages, $page]) => $allMessages[$page.params['conversationId']] ? $allMessages[$page.params['conversationId']] : [])
