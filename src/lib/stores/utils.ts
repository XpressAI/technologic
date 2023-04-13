import {writable, get} from "svelte/store";
import type {Writable} from "svelte/store";
import localforage from "localforage";
import {browser} from "$app/environment";



export function createItemStore<Type>(database: string, table: string, itemKey: string, initialValue: Type): Writable<Type> {
    const store = writable<Type>(initialValue);
    if(browser){
        const db = localforage.createInstance({
            name: database,
            storeName: table,
            driver: localforage.INDEXEDDB
        });

        const ready = db.ready().then(async () => {
            const item: Type | null = await db.getItem(itemKey);
            if(item !== null){
                store.set(item);
            }else{
                store.set(initialValue);
            }
        });

        return {
            subscribe: store.subscribe,
            set: async (value: Type) => {
                await ready;

                await db.setItem(itemKey, value);
                store.set(value);
            },
            update: async (updater: (currentValue: Type) => Type) => {
                await ready;

                const currentValue = get(store);
                const newValue = updater(currentValue);
                await db.setItem(itemKey, newValue);
                store.set(newValue);
            }
        }
    }

    return store;
}
