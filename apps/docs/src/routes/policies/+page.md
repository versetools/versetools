---
home: true
title: Versetools Policies
tagline: Review Versetools' terms of service, acceptable use policy, privacy practices, content removal procedures, and other site policies.
actions:
  - label: Overview
    to: /policies/terms
    type: primary
meta: true
---

<script lang="ts">
  import config from "@versetools/config";
  import Card from "$lib/components/Card.svelte";
</script>

## Recommended

<div class="grid sm:grid-cols-2 gap-4">
  <Card title="{config.name} Terms of Service" href="/policies/terms" />
  <Card title="{config.name} Acceptable Use Policy" href="/policies/abuse" />
  <Card title="{config.name} Privacy Policy" href="/policies/privacy" />
  <Card title="Copyright Claims Policy" href="/policies/copyright" />
</div>
