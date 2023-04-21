<script lang="ts">
    import {currentConversation, currentMessageThread, selectMessageThreadThrough} from "../stores/technologicStores";
    import SvelteMarkdown from "svelte-markdown";

    const xBase = 13;
    const yBase = 25;
    const xOffset = 50;
    const yOffset = 75;
    const strokeWidth = 10;

    let messagePositions = {}
    let maxDepth = 0;
    let maxWidth = 0;
    $: {
        // Calculate the depth for every node in the graph
        const depths = Object.fromEntries(Object.keys($currentConversation?.messages).map((messageId) => {
            let depth = 0;
            let parentLink = $currentConversation?.graph.find(it => it.to === messageId);
            while(parentLink.from){
                depth += 1;
                parentLink = $currentConversation?.graph.find(it => it.to === parentLink.from)
            }

            return [messageId, depth]
        }))
        const positions = {};
        Object.entries(depths).forEach(([messageId, depth]) => {
            const prevValue = positions[depth] || {};
            positions[depth] = {
                ...prevValue,
                [messageId]: Object.keys(prevValue).length
            }
        })
        Object.entries(positions).forEach(([depth, pos]) => {
            Object.entries(pos).forEach(([messageId, position] )=> {
                messagePositions[messageId] = {
                    x: position * xOffset + xBase,
                    y: parseInt(depth) * yOffset + yBase
                }
            })
        })
        maxDepth = Math.max(...Object.values(depths));
        maxWidth = Math.max(...Object.values(positions).map(it => Object.keys(it).length));
    }

    function getPath(from, to) {
        const {x: x1, y: y1} = from;
        const {x: x2, y: y2} = to;
        const dx = x2 - x1;
        const dy = y2 - y1;

        // Calculate control point for the Bezier curve
        const c1x = x1 + dx * 0.1;
        const c1y = y1 + dy * 0.5;

        const c2x = x1 + dx * 0.5;
        const c2y = y1 + dy * 0.5;


        return `M${x1},${y1} C${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`;
    }

    function inCurrentThread(messageId: string){
        return $currentMessageThread.messages.find(it => it.self === messageId)
    }

    let hoveredMessageId = null;

</script>

<div class="container w-full h-full flex flex p-4 gap-4">
    <div>
        <h2>Chat Graph</h2>
        <svg width={maxWidth * xOffset + xBase * 2} height={maxDepth * yOffset + yBase * 2} class="flex-shrink-0">
            {#each $currentConversation?.graph as link}
                {#if link.from }
                    <path
                            d={getPath(messagePositions[link.from], messagePositions[link.to])}
                            stroke="currentColor"
                            stroke-width={strokeWidth}
                            fill="none"
                            class="{inCurrentThread(link.from) && inCurrentThread(link.to) ? 'text-primary-500-400-token' : 'text-surface-300-600-token'} drop-shadow"
                    />
                {/if}
            {/each}
            {#each Object.entries(messagePositions) as [messageId, position]}
                {@const msg = $currentConversation.messages[messageId]}
                <g class="cursor-pointer {inCurrentThread(messageId) ? 'text-primary-400-500-token' : 'text-surface-700-200-token'} hover:text-primary-600-300-token"
                   on:mouseover={() => hoveredMessageId = messageId}
                   on:mouseout={() => hoveredMessageId = null}
                   on:click={() => selectMessageThreadThrough(messageId)}
                >
                <circle cx={position.x} cy={position.y}
                        r="12"
                        fill="currentColor"
                        class="drop-shadow"


                />

                {#if msg.message.role === 'user'}
                    <g stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"
                       transform="translate({position.x - 10}, {position.y - 10}) scale(0.8)" class="text-primary-700-200-token"
                    >
                        <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
                        <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                    </g>
                {/if}
                {#if msg.message.role === 'assistant'}
                    <g stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"
                       transform="translate({position.x - 9}, {position.y - 9}) scale(0.8)" class="text-primary-700-200-token"
                    >
                        <path d="M4 21v-13a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-9l-4 4" />
                        <path d="M9.5 9h.01" />
                        <path d="M14.5 9h.01" />
                        <path d="M9.5 13a3.5 3.5 0 0 0 5 0" />
                    </g>
                {/if}
                {#if msg.message.role === 'system'}
                    <g stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"
                       transform="translate({position.x - 10}, {position.y - 10}) scale(0.8)" class="text-primary-700-200-token"
                    >
                        <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
                        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                    </g>
                {/if}
                </g>
            {/each}
        </svg>
    </div>
    <div class="card p-2 overflow-hidden" style="width: max(36ch, {maxWidth * xOffset + xBase * 2}px)">
        {#if hoveredMessageId}
            <SvelteMarkdown source={$currentConversation.messages[hoveredMessageId].message.content} />
        {:else}
            Hover over a node to preview its message.
        {/if}
    </div>
</div>
