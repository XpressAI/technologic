<script lang="ts">
	import IconMessageChatbot from '@tabler/icons-svelte/dist/svelte/icons/IconMessageChatbot.svelte';
	import { configStore } from '$lib/stores/technologicStores';
	import { t, l, locales } from '$lib/translations';
	import { getLocaleFromLocalStorageWithDefault, Locale } from '$lib/translations/util';
	getLocaleFromLocalStorageWithDefault('locale', Locale.en);

	$: misconfiguredOpenAI = !$configStore.backends
		.find((it) => it.name === 'OpenAI')
		?.token.startsWith('sk-');
</script>

<main class="card m-5">
	<header class="card-header">
		<h1 class="flex gap-1">Technologic <IconMessageChatbot size="48" /></h1>
		<h2>Branching AI Chat</h2>
	</header>
	<section class="p-4 gap-4 flex flex-col">
		<p>
			{$t('main.introduction')}
		</p>

		<div>
			<h3>{$t('main.featuresHeading')}</h3>
			<ul>
				{#each { length: 10 } as _, i}
					<li>
						<strong> {$t(`main.features.${i}.title`)}</strong>: {$t(
							`main.features.${i}.description`
						)}
					</li>{/each}
			</ul>
		</div>

		<div>
			<h3>Made by Xpress AI</h3>
      <p>
        {@html $t('main.xpressai')}
      </p>
		</div>
	</section>
</main>

{#if misconfiguredOpenAI}
	<section class="card variant-glass-error m-5 p-4">
    {@html $t('main.backendConfigurationWarning')}
	</section>
{/if}
