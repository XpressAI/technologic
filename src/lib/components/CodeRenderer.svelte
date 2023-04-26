<script lang="ts">
    import hljs from 'highlight.js/lib/core';

    import { CodeBlock } from '@skeletonlabs/skeleton';
    import {browser} from "$app/environment";
	export let lang;
	export let text;

    $: actualLang = lang ? lang : 'plaintext'
    let loadedLangs = {
        plaintext: true
    }
    $: loadLanguage(actualLang)

    async function loadLanguage(actualLang) {
        if (!loadedLangs[actualLang] && browser) {
            try {
                /* @vite-ignore */
                const languageModule = await import(`https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/es/languages/${actualLang}.min.js`);
                hljs.registerLanguage(actualLang, languageModule.default);
                loadedLangs[actualLang] = true;
            }catch (e) {
                console.info(`Language ${actualLang} not found for highlight.js`);
            }
        }
    }
</script>

{#if loadedLangs[actualLang]}
    <CodeBlock language={actualLang} code={text} />
{:else}
    <CodeBlock language="plaintext" code={text} />
{/if}

