import {createItemStore} from "./utils";
import {allConversations} from "./conversationStore";
import {derived} from "svelte/store";


export interface Folder {
    name: string
    folders: Folder[]
    conversations: string[]
}

const initialValue = {
    name: "/",
    folders: [],
    conversations: []
};

export const rawFolderStore = createItemStore<Folder>("technologic", "folders", "folders",
    initialValue
);

export const folderStore = derived([rawFolderStore, allConversations], ([$rawFolderStore, $allConversations]) => {
    if(Object.keys($allConversations).length == 0){
        return initialValue
    }else{
        return $rawFolderStore;
    }
})
