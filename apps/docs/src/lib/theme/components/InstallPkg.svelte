<script lang="ts" module>
  export type InstallPkgProps = {
    npm?: Snippet,
    yarn?: Snippet,
    pnpm?: Snippet,
    bun?: Snippet,
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  import Bun from './icons/logos/Bun.svelte'
  import BunWithColor from './icons/logos/BunWithColor.svelte'
  import Npm from './icons/logos/Npm.svelte'
  import NpmWithColor from './icons/logos/NpmWithColor.svelte'
  import Pnpm from './icons/logos/Pnpm.svelte'
  import PnpmWithColor from './icons/logos/PnpmWithColor.svelte'
  import Yarn from './icons/logos/Yarn.svelte'
  import YarnWithColor from './icons/logos/YarnWithColor.svelte'
  import TabPanel from './TabPanel.svelte'
  import Tabs from './Tabs.svelte'
  
  const { npm, yarn, pnpm, bun }: InstallPkgProps = $props()
</script>

<Tabs activeName="NPM" bodyPadding={false}>
  <TabPanel name="NPM" activeIcon={NpmWithColor} inactiveIcon={Npm}>
    {@render npm?.()}
  </TabPanel>
  <TabPanel name="YARN" activeIcon={YarnWithColor} inactiveIcon={Yarn}>
    {@render yarn?.()}
  </TabPanel>
  <TabPanel name="PNPM" activeIcon={PnpmWithColor} inactiveIcon={Pnpm}>
    {@render pnpm?.()}
  </TabPanel>
  <TabPanel name="BUN" activeIcon={BunWithColor} inactiveIcon={Bun}>
    {@render bun?.()}
  </TabPanel>
</Tabs>
