<script lang="ts">
	import IconServer from '@tabler/icons-svelte/dist/svelte/icons/IconServer.svelte';
	import IconEdit from '@tabler/icons-svelte/dist/svelte/icons/IconEdit.svelte';

	import { configStore } from '$lib/stores/technologicStores';
	import type { BackendConfiguration } from '$lib/stores/schema';

	import { t, l, locales } from '$lib/translations';
	import { getLocaleFromLocalStorageWithDefault, Locale } from '$lib/translations/util';
	getLocaleFromLocalStorageWithDefault('locale', Locale.en);

	$: currentBackend = $configStore.backends.find(
		(backend) => backend.name === $configStore.backend.name
	);

	function setBackend(backend: BackendConfiguration) {
		$configStore = {
			...$configStore,
			backend: {
				name: backend.name,
				model: backend.defaultModel
			}
		};
	}

	function setModel(model: string) {
		$configStore = {
			...$configStore,
			backend: {
				...$configStore.backend,
				model: model
			}
		};
	}
</script>

<section class="card p-3 m-3 variant-glass flex flex-col gap-2">
	<h3>{$t('settings.backend.backends')}</h3>
	<nav class="list-nav">
		<ul>
			{#each $configStore.backends as backend}
				<li>
					<a
						href="#"
						on:click={() => setBackend(backend)}
						class:bg-surface-active-token={backend.name === $configStore.backend.name}
					>
						<span><IconServer /></span>
						<span class="flex-grow">
							{backend.name}
						</span>
						<span>
							<a href="/settings/backends/{backend.name}"><IconEdit /></a>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</section>

<section class="card p-3 m-3 variant-glass flex flex-col gap-2">
	<h3>{$t('settings.backend.useModel')}:</h3>
	<nav class="list-nav">
		<ul>
			{#each currentBackend.models as model}
				<li>
					<a
						on:click={() => setModel(model)}
						class:bg-surface-active-token={model === $configStore.backend.model}
					>
						<span>{model}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</section>
