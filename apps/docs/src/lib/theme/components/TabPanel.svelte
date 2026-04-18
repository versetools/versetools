<script lang="ts" module>
  export type TabPanelProps = {
    name: string,
    activeIcon?: Component,
    inactiveIcon?: Component,
    children?: Snippet
  }
</script>

<script lang="ts">
  import { getContext, type Component, type Snippet } from 'svelte'
	import type { Writable } from 'svelte/store';

  import { activeNameContextKey, itemsKey } from './Tabs.svelte'

  const {
    name,
    activeIcon = undefined,
    inactiveIcon = undefined,
    children,
  }: TabPanelProps = $props()

  const current = getContext<Writable<string | undefined>>(activeNameContextKey)
  const items = getContext<Writable<{
    name: string,
    activeIcon?: Component,
    inactiveIcon?: Component,
  }[]>>(itemsKey)

  // svelte-ignore state_referenced_locally
  $items.push({
    name,
    activeIcon,
    inactiveIcon,
  })
   
  $items = $items
</script>

{#if name === $current}
  <div class="tab-panel">
    {@render children?.()}
  </div>
{/if}

<style>
  :global(.tab-panel .svp-code-block-wrapper) {
    --at-apply: 'm-none';
  }
</style>
