<script lang="ts" module>
  export type CodeBlockProps = {
    code?: string,
    lang: string,
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  import themeOptions from 'virtual:sveltepress/theme-default'

  let { code = '', lang }: CodeBlockProps = $props()

  let highlightedCode = $state('')

  async function loadShikiAndHighlight() {
    const { codeToHtml } = await import('shiki')
    highlightedCode = await codeToHtml(code, {
      lang,
      themes: {
        dark: themeOptions.highlighter!.themeDark ?? 'night-owl',
        light: themeOptions.highlighter!.themeDark ?? 'vitesse-light',
      },
    })
  }

  onMount(() => {
    loadShikiAndHighlight()
  })
</script>

<div>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html highlightedCode}
</div>
