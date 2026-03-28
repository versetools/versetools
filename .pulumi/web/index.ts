import * as toolkit from "@l3dev-private/pulumi-toolkit";
import * as cloudflare from "@pulumi/cloudflare";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const namespaceName = `versetools${pulumi.getStack() === "prod" ? "" : `-${pulumi.getStack()}`}`;

const domain = "versetools.com";
const stackDomain = `${pulumi.getStack() === "prod" ? "" : `${pulumi.getStack()}.`}${domain}`;
const cnameTarget = "aki.asgard.l3.dev";

const appName = "versetools";
const replicas = 1;
const port = 3000;
const portName = `${appName}-port`;

const buildArgs = ["PUBLIC_POSTHOG_KEY", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"];

const containerEnvVars = [
	"DATABASE_URL",
	"DATABASE_ENCRYPTION_KEY",
	"CADDY_API_BASEURL",
	"UPLOADTHING_TOKEN",
	"SESSION_SECRET",
	"DISCORD_CLIENT_ID",
	"DISCORD_CLIENT_SECRET",
	"DISCORD_CLIENT_TOKEN",
	"AWS_ACCESS_KEY_ID",
	"AWS_SECRET_ACCESS_KEY"
];

const config = new pulumi.Config();
const repositoryName = config.require("repositoryName");

const repository = new toolkit.images.ecr.Repository(repositoryName, {
	project: `versetools/${appName}`
});

// const image = new docker.Image(`${appName}-image`, {
// 	build: {
// 		context: "../",
// 		dockerfile: "../Dockerfile",
// 		platform: "linux/amd64",
// 		args: {
// 			...buildArgs.reduce((args, name) => ({ ...args, [name]: process.env[name] }), {})
// 		}
// 	},
// 	imageName: repository.repositoryUrl,
// 	registry: repository.registryCredentials
// });

// export const baseImageName = image.baseImageName;
// export const fullImageName = image.imageName;

const namespace = new k8s.core.v1.Namespace(namespaceName, {
	metadata: {
		name: namespaceName
	}
});

new cloudflare.DnsRecord("CNAME-stack-domain", {
	zoneId: process.env.CLOUDFLARE_ZONE_ID!,
	type: "CNAME",
	name: stackDomain,
	content: cnameTarget,
	proxied: true,
	ttl: 1
});

const app = new toolkit.apps.App(appName, {
	namespace,
	replicas,
	containers: [
		{
			name: appName,
			image,
			imagePullPolicy: "Always",
			ports: [
				{
					containerPort: port,
					name: portName
				}
			],
			env: toolkit.helpers.loadEnv(containerEnvVars)
		}
	],
	ports: [
		{
			name: portName,
			port: 80,
			host: stackDomain
		}
	],
	template: {
		imagePullSecrets: [{ name: "ecr-reg-creds" }]
	}
});

export const appStatus = app.status;
export const ingressStatus = app.ingress.status;
