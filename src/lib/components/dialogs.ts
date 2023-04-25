import { modalStore } from '@skeletonlabs/skeleton';

export async function alert(message: string) {
    return new Promise((resolve, reject) => {
        modalStore.trigger({
            type: 'alert',
            body: message,
            response: (response: any) => {
                resolve(response);
            }
        })
    })
}

export async function confirm(message: string) {
    return new Promise<boolean>((resolve, reject) => {
        modalStore.trigger({
            type: 'confirm',
            body: message,
            response: (response: boolean) => {
                resolve(response);
            }
        })
    })
}

export async function prompt(message: string, value?: string) {
    return new Promise<string>((resolve, reject) => {
        modalStore.trigger({
            type: 'prompt',
            body: message,
            value: value,
            response: (response: string) => {
                resolve(response);
            }
        })
    })
}
