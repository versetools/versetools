<script lang="ts" module>
  export type IconifyIconProps = {
    collection: string,
    name: string,
    [key: string]: any
  }
</script>

<script lang="ts">
  const { collection, name, ...rest }: IconifyIconProps = $props()
   
  // svelte-ignore state_referenced_locally
  void rest;
</script>

<div class="i-{collection}-{name}"></div>
