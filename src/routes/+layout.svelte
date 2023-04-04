<script lang="ts">
    // Your selected Skeleton theme:
    import '@skeletonlabs/skeleton/themes/theme-gold-nouveau.css';
    import "@fontsource/quicksand";

    // This contains the bulk of Skeletons required styles:
    import '@skeletonlabs/skeleton/styles/all.css';

    import '../app.postcss';

    import '@skeletonlabs/skeleton/themes/theme-rocket.css';
    import hljs from 'highlight.js';
    import 'highlight.js/styles/tomorrow-night-bright.css';
    import { storeHighlightJs } from '@skeletonlabs/skeleton';

    storeHighlightJs.set(hljs);

    import {AppShell} from '@skeletonlabs/skeleton';

    import {conversations} from "$lib/stores/conversationStore";


    function rename(conv){
        conv.title = prompt("What name do you want to use?", conv.title);
        $conversations = $conversations
    }

</script>

<AppShell>
    <svelte:fragment slot="sidebarLeft">
        <nav class="list-nav flex-grow">
            <ul>
                <li><a href="/{$conversations.length}">Start new Conversation</a></li>
                {#each $conversations as conv}
                    <li on:contextmenu|preventDefault={() => rename(conv)}>
                        <p class="line-clamp-2">
                            <a href="/{conv.id}">{conv.title}</a>
                        </p>
                    </li>
                {/each}
            </ul>
        </nav>
    </svelte:fragment>

    <slot />
</AppShell>
