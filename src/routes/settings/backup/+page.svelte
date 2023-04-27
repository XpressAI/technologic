<script lang="ts">
    import { FileButton } from '@skeletonlabs/skeleton';
    import {dumpDatabase, loadDatabase} from "$lib/stores/technologicStores";
    import {confirm} from "$lib/components/dialogs";

    let downloadEnabled = true;
    async function downloadDatabase() {
        downloadEnabled = false;
        const data = JSON.stringify(await dumpDatabase(), null, 2);
        const blob = new Blob([data], {type: 'application/octet-stream'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'technologic.json';
        a.click();
        window.URL.revokeObjectURL(url);
        downloadEnabled = true;
    }

    let files: FileList;
    let reloadEnabled = true;
    async function reloadDatabase(e){
        reloadEnabled = false;
        if(await confirm("Are you sure you want to load the database file? It will overwrite the current database. This action cannot be undone.")){
            await loadDatabase(JSON.parse(await files[0].text()));
            window.location.reload();
        }

        reloadEnabled = true;
        return false;
    }
</script>

<section class="card p-3 m-3 variant-glass flex flex-col gap-2">
    <h3>Backup / Restore</h3>
    <p><button class="btn variant-filled-primary" on:click={downloadDatabase} disabled={!downloadEnabled}>Download Database</button></p>
    <p><FileButton name="dbfiles" bind:files button="variant-filled-secondary" on:change={reloadDatabase} disabled={!reloadEnabled}>Reload Database</FileButton></p>
</section>
