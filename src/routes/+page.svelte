<script lang="ts">
	import IconMessageChatbot from '@tabler/icons-svelte/dist/svelte/icons/IconMessageChatbot.svelte';
	import { configStore } from '../lib/stores/technologicStores';

	$: misconfiguredOpenAI = !$configStore.backends
		.find((it) => it.name === 'OpenAI')
		?.token.startsWith('sk-');
</script>

<main class="card m-5">
	<header class="card-header">
		<h1 class="flex gap-1">Technologic <IconMessageChatbot size="48" /></h1>
		<h2>Branching Chat GPT</h2>
	</header>
	<section class="p-4 gap-2 flex flex-col">
		<p>Technologic is a chat client that uses ChatGPT or RWKV</p>
		<p>
			The unique feature of this chat client is that it allows users to branch off the main
			conversation at any point to explore different ideas or go on tangents without disrupting the
			flow of the main conversation.
		</p>
		<p>
			This branching feature of Technologic is designed to enhance the user experience and enable
			more exploratory and engaging conversations. It allows for more dynamic and creative
			conversations without the risk of polluting the main topic.
		</p>
		<p>
			Technologic was created by <a href="https://www.xpress.ai">Xpress.ai</a>, a company that
			specializes in developing AI solutions. With a focus on delivering cutting-edge technology
			that enhances the user experience, Xpress.ai's team of experts developed "Technologic" to
			provide a unique and powerful chat client that enables users to have more dynamic and engaging
			conversations.
		</p>
	</section>
</main>

{#if misconfiguredOpenAI}
	<section class="card variant-glass-error m-5 p-4">
		You must set your OpenAI in the <a href="/settings/backends/OpenAI">Backend Settings</a> to be able
		to use that backend.
	</section>
{/if}
