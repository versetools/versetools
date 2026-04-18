<script lang="ts" module>
  export type SidebarGroupProps = {
    items?: LinkItem[];
    title?: string;
    to?: string;
    collapsible?: boolean;
    nested?: boolean;
  }
</script>

<script lang="ts">
  import { scale, slide } from 'svelte/transition'
	import type { LinkItem } from 'virtual:sveltepress/theme-default';

  import { page } from '$app/state'

  import ArrowDown from './icons/ArrowDown.svelte'
  import PointLeft from './icons/PointLeft.svelte'
  import Link from './Link.svelte'
  import SidebarGroup from './SidebarGroup.svelte'
  import { isLinkActive } from './utils'

  function isChildActive(items: LinkItem[], routeId: string | null): boolean {
    return items.some(item => {
      if (item.to && routeId && isLinkActive(item.to, routeId)) {
        return true
      }

      if (Array.isArray(item.items) && item.items.length) {
        return isChildActive(item.items, routeId)
      }

      return false
    })
  }

  const routeId = $derived(page.route.id)

  const {
    items = [],
    title = '',
    to,
    collapsible = false,
    nested = false,
  }: SidebarGroupProps = $props()

  // svelte-ignore state_referenced_locally
  let collapsed = $state(collapsible)

  // svelte-ignore state_referenced_locally
  if (collapsible) {
    $effect(() => {
      if (collapsed && isChildActive(items, routeId)) {
        collapsed = false
      }
    })
  }

  function handleToggle() {
    collapsed = !collapsed
  }
</script>

<div class="sidebar-group">
  <div class="group-title" class:with-mb={!nested}>
    {#if to}
      {@const active = !!routeId && isLinkActive(to, routeId)}
      <Link
          {to}
          {active}
          label={title}
          inline={false}
          highlight={false}
        >
          {#if active}
            <div transition:scale class="active-icon">
              <PointLeft />
            </div>
          {/if}
        </Link>
    {:else}
      <div>
        {title}
      </div>
    {/if}
    {#if collapsible}
      <div
        class="collapse-control"
        onclick={handleToggle}
        onkeypress={handleToggle}
        role="button"
        tabindex="0"
        aria-label="Collapsable button"
      >
        <div class="arrow" class:collapsed>
          <ArrowDown />
        </div>
      </div>
    {/if}
  </div>
  {#if !collapsed}
    <div class="links" class:links-indent={nested && collapsible} transition:slide>
      {#each items as item (item)}
        {@const active = !!item.to && !!routeId && isLinkActive(item.to, routeId)}
        {#if Array.isArray(item.items) && item.items.length}
          <SidebarGroup {...item} nested />
        {:else}
          <Link
            to={item.to}
            {active}
            label={item.title}
            inline={false}
            highlight={false}
          >
            {#if active}
              <div transition:scale class="active-icon">
                <PointLeft />
              </div>
            {/if}
          </Link>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .with-mb {
    --at-apply: 'mb-2 sm:mb-4';
  }
  .sidebar-group:not(:last-of-type) {
    --at-apply: 'border-b-solid border-b border-light-8 dark:border-b-gray-7 mb-4 pb-4';
  }
  .group-title {
    --at-apply: 'font-bold text-slate-8 dark:text-slate-2 flex items-center justify-between';
  }
  .links {
    --at-apply: 'leading-8 overflow-hidden';
  }
  .links-indent {
    --at-apply: 'pl-4';
  }
  .collapse-control {
    --at-apply: 'transition transition-200 transition-bg transition-transform cursor-pointer text-5 hover:bg-gray-2 active:bg-gray-3 dark:hover:bg-gray-8 dark:active:bg-gray-7 w-[28px] h-[28px] flex items-center justify-center rounded';
  }
  .arrow {
    --at-apply: 'flex items-center transition-300 transition-transform';
  }
  .collapsed {
    --at-apply: 'rotate--90';
  }
  .active-icon {
    --at-apply: 'text-svp-primary ml-4 mt-1 flex items-center text-4';
  }
</style>
