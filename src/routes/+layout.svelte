<script lang="ts">
	import '@skeletonlabs/skeleton/styles/all.css';

	import '@skeletonlabs/skeleton/themes/theme-hamlindigo.css';
	//import '@fontsource/quicksand';

	import { AppShell, Drawer, Toast, Modal } from '@skeletonlabs/skeleton';
	import { LightSwitch, setInitialClassState } from '@skeletonlabs/skeleton';
	setInitialClassState();

	import Folder from '$lib/components/Folder.svelte';
	import Menu from '$lib/components/Menu.svelte';

	import { folderStore } from '$lib/stores/technologicStores';

  import logo from '$lib/assets/xpress-ai-logo-white.png';

	import IconMessageChatbot from '@tabler/icons-svelte/dist/svelte/icons/IconMessageChatbot.svelte';
	import IconSettings from '@tabler/icons-svelte/dist/svelte/icons/IconSettings.svelte';
	import IconChevronLeft from '@tabler/icons-svelte/dist/svelte/icons/IconChevronLeft.svelte';
	import IconChevronRight from '@tabler/icons-svelte/dist/svelte/icons/IconChevronRight.svelte';


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

	let hideSidebar = false;
</script>

<Modal />
<AppShell>
	<svelte:fragment slot="sidebarLeft">
		<div class="h-full relative min-w-[25px]">
			<button class="btn btn-sm variant-soft !p-0 absolute right-[1px] top-5 text-surface-600-300-token"
					title="Toggle Sidebar"
					on:click={() => hideSidebar = !hideSidebar}>
				{#if hideSidebar }
					<IconChevronRight />
				{:else}
					<IconChevronLeft />
				{/if}
			</button>
			<nav class="list-nav p-2 h-full variant-ghost flex flex-col ring-0 border-r border-surface-500 w-56 overflow-y-auto" class:hidden={hideSidebar}>
				<a href="/">
					<div class="flex flex-col">
						<div class="flex gap-1 text-2xl font-bold items-center relative">
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
						<div slot="button" class="flex gap-2">
							<IconSettings />
						</div>
						<div class="card">
							<ul class="list">
								<li class="flex p-2">
									<LightSwitch /> <div>Dark Mode</div>
								</li>
							</ul>
							<nav class="list-nav">
								<ul class="list-nav card p-2">
									<li>
										<a href="/settings/backends">Backends</a>
									</li>
									<li>
										<a href="/settings/tools">Tools</a>
									</li>
									<li>
										<a href="/settings/backup">Backup / Restore</a>
									</li>
								</ul>
							</nav>
						</div>
					</Menu>
				</div>
				<div>
					<a href="https://www.xpress.ai" class="card flex variant-ghost gap-2 place-content-center">
						<div class="w-36">
							<img alt="Xpress AI logo"	src={logo} />
						</div>
					</a>
				</div>
			</nav>
		</div>
	</svelte:fragment>

	<slot />
</AppShell>
<Toast />
<Drawer width="w-fit">
	<ConversationGraph />
</Drawer>
