---
home: true
title: Versetools Policies
tagline: Review Versetools' terms of service, acceptable use policies, privacy practices, content removal procedures, and other site policies.
actions:
  - label: Overview
    to: /policies/terms
    type: primary
meta: true
---

<script lang="ts">
  import config from "@versetools/config";
  import { Card } from "@versetools/ui";
</script>

## Recommended

<div class="preflight grid @2xl:grid-cols-2 @4xl:grid-cols-3 gap-4">
  <Card size="full" as="a" href="/policies/terms">
    <Card.Header class="min-h-24">
      <Card.Title size="xs">{config.name} Terms of Service</Card.Title>
    </Card.Header>
  </Card>
  <Card size="full" as="a" href="/policies/privacy">
    <Card.Header class="min-h-24">
      <Card.Title size="xs">{config.name} Privacy Policy</Card.Title>
    </Card.Header>
  </Card>
  <Card size="full" as="a" href="/policies/abuse">
    <Card.Header class="min-h-24">
      <Card.Title size="xs">{config.name} Acceptable Use Policy</Card.Title>
    </Card.Header>
  </Card>
  <Card size="full" as="a" href="/policies/copyright">
    <Card.Header class="min-h-24">
      <Card.Title size="xs">Copyright Policy</Card.Title>
    </Card.Header>
  </Card>
</div>
