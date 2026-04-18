<script lang="ts" module>
  export type BackdropProps = {
    show?: boolean
    top?: number | string
    zIndex?: number,
    onClose?: () => void
  }
</script>

<script lang="ts">
  const { show = false, top = 0, zIndex = 900, onClose }: BackdropProps = $props()
</script>

<div
  class="backdrop"
  class:show
  onclick={onClose}
  onkeyup={onClose}
  role="none"
  style:top
  style:z-index={zIndex}
></div>

<style>
  .backdrop {
    --at-apply: 'svp-modal-bg';
  }
  .show {
    --at-apply: 'svp-modal-bg-show';
  }
</style>
