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
	<section class="p-4 gap-4 flex flex-col">
		<p>
			Technologic is a powerful, feature-rich AI Chatbot Client that is designed to work seamlessly with OpenAI's API or any
			compatible backend. With a user-friendly interface and the ability to organize, modify, and manage your conversations,
			Technologic brings you a next-level chatting experience with your AI assistant.
		</p>

		<div>
			<h3>Features</h3>
			<ul>
				<li><strong>Secure Storage</strong>: Your conversations are stored locally on your computer using your browser's IndexedDB storage.</li>
				<li><strong>Backend Compatibility</strong>: Works with any backend compatible with OpenAI's API.</li>
				<li><strong>Bring Your Own API Key</strong>: Easily configure your OpenAI API key or any other compatible backend.</li>
				<li><strong>Organize Conversations</strong>: Keep your conversations tidy by organizing them into folders.</li>
				<li><strong>Message Modification</strong>: Edit and modify messages, both sent and received, as needed.</li>
				<li><strong>Custom Personality</strong>: Support for "System Messages" to give your chatbot a unique personality (if supported by the backend).</li>
				<li><strong>Fork Conversations</strong>: Easily branch off into different topics without losing the context of previous conversations.</li>
				<li><strong>Elaborate</strong>: Use the "Go on" feature to prompt the bot to expand on its last message.</li>
				<li><strong>Merge Messages</strong>: Combine messages to avoid fragmentation or incomplete code blocks.</li>
				<li><strong>View Raw Message</strong>: Access the raw text of any message with the flip of a switch.</li>
			</ul>
		</div>

		<div>
			<h3>Made by Xpress AI</h3>
			<p>
				Technologic was created by <a href="https://www.xpress.ai">Xpress AI</a>, a company that
				specializes in developing AI solutions. With a focus on delivering cutting-edge technology
				that enhances the user experience, Xpress.ai's team of experts developed "Technologic" to
				provide a unique and powerful chat client that enables users to have more dynamic and engaging
				conversations.
			</p>
		</div>
	</section>
</main>

{#if misconfiguredOpenAI}
	<section class="card variant-glass-error m-5 p-4">
		You must set your OpenAI in the <a href="/settings/backends/OpenAI">Backend Settings</a> to be able
		to use that backend.
	</section>
{/if}
