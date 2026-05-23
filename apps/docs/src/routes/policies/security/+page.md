---
title: Security Overview
description: Keeping customer data safe and secure is a huge responsibility and a top priority for us. Here’s how we make it happen.
---

<script lang="ts">
    import config from "@versetools/config";
</script>

## We protect your data.

All data are written to multiple disks instantly, backed up daily, and stored in multiple locations. Files that our customers upload are stored on servers that use modern techniques to remove bottlenecks and points of failure.

## Your data is sent using HTTPS.

Whenever your data is in transit between you and us, everything is encrypted, and sent using HTTPS. Within our firewalled private networks, data may be transferred unencrypted.

Any files which you upload to us are stored and are encrypted at rest. Our application databases are generally not encrypted at rest — the information you add to the applications is active in our databases and subject to the same protection and monitoring as the rest of our systems.

## Regularly-updated infrastructure.

Our software infrastructure is updated regularly with the latest security patches.

## We never store your billing information.

All credit card transactions are processed by our payment processor [Polar.sh](https://polar.sh/legal/checkout-buyer-terms).

## Want to know more?

Contact us at [{config.emails.security}](mailto:{config.emails.security}) to learn more about our security practices.

## Have a concern? Need to report an incident?

Have you noticed abuse, misuse, an exploit, or experienced an incident with your account? Please visit our [security response page](./security/response) for details on how to securely submit a report.
