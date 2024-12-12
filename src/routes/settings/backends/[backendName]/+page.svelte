<script lang="ts">
	import IconServer from '@tabler/icons-svelte/dist/svelte/icons/IconServer.svelte';
	import IconDeviceFloppy from '@tabler/icons-svelte/dist/svelte/icons/IconDeviceFloppy.svelte';
	import IconCircleLetterX from '@tabler/icons-svelte/dist/svelte/icons/IconCircleLetterX.svelte';
	import IconCirclePlus from '@tabler/icons-svelte/dist/svelte/icons/IconCirclePlus.svelte';
	import IconTrashX from '@tabler/icons-svelte/dist/svelte/icons/IconTrashX.svelte';
	import { configStore } from '$lib/stores/technologicStores';
	import { page } from '$app/stores';
	import type { BackendConfiguration } from '$lib/stores/schema';
	import { toastStore } from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';
	import EditableString from '$lib/components/EditableString.svelte';
	import { alert, prompt, confirm } from "$lib/components/dialogs";


	$: backend = $configStore.backends.find((backend) => backend.name === $page.params.backendName);

	let dto: BackendConfiguration;
	$: {
		if (!dto) {
			dto = { ...backend };
		}
	}

	async function save() {
		$configStore = {
			...$configStore,
			backends: $configStore.backends.map((b) => (b.name === backend.name ? dto : b))
		};
		await goto('/settings/backends');
		toastStore.trigger({
			message: `${dto.name} backend changes saved`,
			background: 'variant-filled-success'
		});
	}

	async function deleteModel(model) {
		if (await confirm(`Are you sure you want to delete the model ${model}?`)) {
			if (model === dto.defaultModel) {
				dto.defaultModel = dto.models[0] || '';
			}
			dto.models = dto.models.filter((m) => m !== model);
		}
	}

	async function addModel() {
		dto.models = [...dto.models, ''];
	}
</script>

<section class="card m-3 variant-glass">
	<h3 class="card-header flex gap-2 items-center">
		<span>
			<IconServer />
		</span>
		<span>
			Backend: {(backend) ? backend.name : 'No backend found' }
		</span>
	</h3>
	<div class="flex flex-col gap-2 p-5">
		<label class="label">
			<span>Name</span>
			<input class="input p-1" type="text" bind:value={dto.name} />
		</label>
		<label class="label">
			<span>Base URL</span>
			<input
				class="input p-1"
				type="text"
				bind:value={dto.url}
				placeholder="https://api.openai.com/v1"
			/>
		</label>
		<label class="label">
			<span>API Type</span>
			<select name="type" class="input select p-1" bind:value={dto.api}>
				<option value="openai">Open AI</option>
				<option value="anthropic">Anthropic</option>
				<option value="openchat">Open Chat</option>
			</select>
		</label>
		<label class="label">
			<span>Token</span>
			<input class="input p-1" type="password" bind:value={dto.token} />
		</label>
		<label class="label">
			<span>Default Model</span>
			<select class="select" bind:value={dto.defaultModel}>
				<option value="" disabled>Select a model</option>
        {#if dto.models}
          {#each dto.models as model}
            <option value={model}>{model}</option>
          {/each}
        {/if}
			</select>
		</label>
		<div>
			<h4>Models</h4>
			<ul class="list">
        {#if dto.models}
          {#each dto.models as model}
            <li class="flex">
              <EditableString bind:value={model} initialEditing={model === ''} />
              <button class="btn-icon w-8 p-0 variant-soft-error" on:click={() => deleteModel(model)}>
                <IconTrashX size="16" />
              </button>
            </li>
          {/each}
        {/if}
				<li>
					<button class="btn variant-soft-surface" on:click={addModel}>
						<span>
							<IconCirclePlus size="16" />
						</span>
						<span> Add Model </span>
					</button>
				</li>
			</ul>
		</div>
	</div>
	<div class="card-footer px-5 flex">
		<div class="flex-grow" />
		<div>
			<button class="btn variant-filled-primary" on:click={save}>
				<span><IconDeviceFloppy /></span>
				<span>Save</span>
			</button>
			<a href="/settings/backends" class="btn variant-ringed-primary">
				<span><IconCircleLetterX /></span>
				<span>Cancel</span>
			</a>
		</div>
	</div>
</section>
