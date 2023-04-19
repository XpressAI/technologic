<script lang="ts">
	import { CodeBlock } from '@skeletonlabs/skeleton';

	export let lang;
	export let text;
</script>

<CodeBlock language={lang ? lang : 'text'} code={text} />
