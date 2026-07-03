import type { SESv2Client } from "@aws-sdk/client-sesv2";
import type { SQSClient } from "@aws-sdk/client-sqs";
import { identifier } from "haywire";

export const sesClientId = identifier<SESv2Client>();
export const sqsClientId = identifier<SQSClient>();
