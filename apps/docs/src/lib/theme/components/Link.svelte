<script lang="ts" module>
  export type LinkProps = {
    label?: string,
    to?: string,
    inline?: boolean,
    active?: boolean,
    highlight?: boolean,
    withBase?: boolean,
    target?: string,
    labelRenderer?: Snippet,
    pre?: Snippet,
    children?: Snippet
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  import External from './icons/External.svelte'
  import { getPathFromBase } from './utils'

  const {
    label = '',
    to = '',
    inline = true,
    active = false,
    highlight = true,
    withBase = true,
    target,
    pre,
    labelRenderer,
    children,
  }: LinkProps = $props()

  let isExternal = $derived(/^https?|mailto:/.test(to))
  let toWithBase = $derived(isExternal ? to : getPathFromBase(to))
</script>

<a
  href={withBase ? toWithBase : to}
  class="link"
  class:no-inline={!inline}
  class:active
  class:highlight
  {...target ? { target } : isExternal ? { target: '_blank' } : {}}
  aria-label={label}
>
  {@render pre?.()}
  {#if labelRenderer}
    {@render labelRenderer?.()}
  {:else}
    <span>
      {label}
    </span>
  {/if}
  {#if isExternal}
    <External />
  {/if}
  {@render children?.()}
</a>

<style>
  .highlight {
    --at-apply: 'text-svp-primary';
  }
  .link {
    --at-apply: 'inline-flex hover:text-svp-hover cursor-pointer items-center transition-200 transition-color';
  }
  .link.no-inline {
    --at-apply: 'flex';
  }
  .active {
    --at-apply: 'svp-gradient-text hover:svp-gradient-text cursor-default';
  }
</style>
