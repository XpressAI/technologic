<script lang="ts">
	// This contains the bulk of Skeletons required styles:
	import '@skeletonlabs/skeleton/styles/all.css';

	// Your selected Skeleton theme:
	import '@skeletonlabs/skeleton/themes/theme-gold-nouveau.css';
	import '@fontsource/quicksand';
	import IconMessageChatbot from '@tabler/icons-svelte/dist/svelte/icons/IconMessageChatbot.svelte';

	import '../app.postcss';

	import hljs from 'highlight.js';
	import 'highlight.js/styles/tomorrow-night-bright.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';

	storeHighlightJs.set(hljs);

	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

	import { AppShell } from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	;
	import Folder from '$lib/Folder.svelte';
	import { folderStore } from '$lib/stores/technologicStores';
</script>

<AppShell>
	<svelte:fragment slot="sidebarLeft">
		<nav
			class="list-nav p-2 h-full variant-ghost flex flex-col ring-0 border-r border-surface-500 w-56 overflow-y-auto"
		>
			<a href="/">
				<div class="flex flex-col">
					<div class="flex gap-1 text-2xl font-bold items-center">Technologic <IconMessageChatbot /></div>
					<span class="text-lg">Branching Chat GPT</span>
				</div>
			</a>
			<div class="flex-grow mt-2">
				<ul>
					<li><a href="/new">Start new Conversation</a></li>
					<li><hr /></li>
					<li><Folder folder={$folderStore} /></li>
				</ul>
			</div>
			<div class="flex place-content-center p-2">
				<div>
					<LightSwitch />
				</div>
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
