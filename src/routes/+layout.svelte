<script lang="ts">
	import '@skeletonlabs/skeleton/styles/all.css';

	import '@skeletonlabs/skeleton/themes/theme-hamlindigo.css';
	//import '@fontsource/quicksand';

	import { AppShell, Drawer, Toast, Modal } from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';

	import Folder from '$lib/components/Folder.svelte';
	import Menu from '$lib/components/Menu.svelte';

	import { folderStore } from '$lib/stores/technologicStores';

	import IconMessageChatbot from '@tabler/icons-svelte/dist/svelte/icons/IconMessageChatbot.svelte';
	import IconSettings from '@tabler/icons-svelte/dist/svelte/icons/IconSettings.svelte';

	import '../app.postcss';

	import hljs from 'highlight.js/lib/core';
	import plaintext from 'highlight.js/lib/languages/plaintext';
	import 'highlight.js/styles/tomorrow-night-bright.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';

	hljs.registerLanguage('plaintext', plaintext);
	storeHighlightJs.set(hljs);

	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import ConversationGraph from '$lib/components/ConversationGraph.svelte';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<Modal />
<AppShell>
	<svelte:fragment slot="sidebarLeft">
		<nav
			class="list-nav p-2 h-full variant-ghost flex flex-col ring-0 border-r border-surface-500 w-56 overflow-y-auto"
		>
			<a href="/">
				<div class="flex flex-col">
					<div class="flex gap-1 text-2xl font-bold items-center">
						Technologic <IconMessageChatbot />
					</div>
					<span class="text-lg">Branching AI Chat</span>
				</div>
			</a>
			<div class="flex-grow mt-2">
				<ul>
					<li><a href="/new">Start new Conversation</a></li>
					<li><hr /></li>
					<li><Folder folder={$folderStore} /></li>
				</ul>
			</div>
			<div class="flex place-content-end p-2">
				<Menu id="settings">
					<div slot="button">
						<IconSettings />
					</div>
					<div class="card">
						<ul class="list">
							<li class="flex gap-2">
								<LightSwitch /> Dark Mode
							</li>
						</ul>
						<nav class="list-nav">
							<ul class="list-nav card p-2">
								<li>
									<a href="/settings/backends">Backends</a>
								</li>
							</ul>
						</nav>
					</div>
				</Menu>
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
<Toast />
<Drawer width="w-fit">
	<ConversationGraph />
</Drawer>
