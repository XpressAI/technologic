<script lang="ts">
	// This contains the bulk of Skeletons required styles:
	import '@skeletonlabs/skeleton/styles/all.css';

	// Your selected Skeleton theme:
	import '@skeletonlabs/skeleton/themes/theme-gold-nouveau.css';
	import '@fontsource/quicksand';

	import '../app.postcss';

	import hljs from 'highlight.js';
	import 'highlight.js/styles/tomorrow-night-bright.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';

	storeHighlightJs.set(hljs);

	import { AppShell } from '@skeletonlabs/skeleton';

	import { page } from '$app/stores';
	import { technologic } from '$lib/stores/technologicStore';
	import type { Message } from '$lib/OpenAI';
	import { sendMessage } from '$lib/OpenAI';

	let { conversations, messages, renameConversation, getConversationMessages } = technologic;
	$: console.log($conversations);

	function rename(conv) {
		const newTitle = prompt('What name do you want to use?', conv.title);
		if (newTitle) {
			renameConversation(conv, newTitle);
		}
	}

	async function renameWithSummary(conv) {
		const message: Message = {
			role: 'user',
			content: 'In at most 3 words, summarize the chat history excluding this message'
		};

		const history = getConversationMessages(conv, $messages).map((m) => m.message);

		const response = await sendMessage(message, history);

		const newTitle = response.content;
		if (newTitle) {
			renameConversation(conv, newTitle);
		}
	}
</script>

<AppShell>
	<svelte:fragment slot="sidebarLeft">
		<nav
			class="list-nav p-2 h-full variant-ghost flex flex-col ring-0 border-r border-surface-500 w-56 overflow-y-auto"
		>
			<a href="/">
				<div class="flex flex-col">
					<span class="text-2xl font-bold">Technologic</span>
					<span class="text-lg">Branching Chat GPT</span>
				</div>
			</a>
			<div class="flex-grow mt-2">
				<ul>
					<li><a href="/{Object.values($conversations).length}">Start new Conversation</a></li>
					<li><hr /></li>
					{#each Object.values($conversations) as conv}
						<li on:contextmenu|preventDefault={() => renameWithSummary(conv)}>
							<p class="line-clamp-2">
								<a
									href="/{conv.id}"
									class:bg-primary-active-token={$page.params.conversationId === conv.id}
								>
									{conv.title}
								</a>
							</p>
						</li>
					{/each}
				</ul>
			</div>
			<div>
				<a href="https://www.xpress.ai" class="card flex variant-ghost gap-2 place-content-center">
					<div class="w-36">
						<img
							loading="lazy"
							src="https://www.xpress.ai/web/image/629-27b48fed/xpress-ai-logo_White_1200px.png"
						/>
					</div>
				</a>
			</div>
		</nav>
	</svelte:fragment>

	<slot />
</AppShell>
