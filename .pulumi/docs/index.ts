import * as aws from "@pulumi/aws";
import * as cloudflare from "@pulumi/cloudflare";
import * as buildx from "@pulumi/docker-build";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

const domain = "docs.versetools.com";
const cnameTarget = "aki.asgard.l3.dev";

const namespaceName = "versetools-docs";

const appName = "versetools-docs";
const appLabels = { app: appName };
const replicas = 1;
const port = 3000;
const portName = "docs-http";

function createRepository(name: string) {
	const repository = new aws.ecr.Repository(name);

	new aws.ecr.LifecyclePolicy(
		`${name}-lifecycle-policy`,
		{
			repository: repository.name,
			policy: {
				rules: [
					{
						rulePriority: 1,
						description: "Remove untagged images",
						selection: {
							tagStatus: "untagged",
							countType: "imageCountMoreThan",
							countNumber: 1
						},
						action: {
							type: "expire"
						}
					}
				]
			}
		},
		{
			parent: repository
		}
	);

	const registry = aws.ecr
		.getAuthorizationTokenOutput({
			registryId: repository.registryId
		})
		.apply(async (credentials) => {
			return {
				address: credentials.proxyEndpoint,
				username: credentials.userName,
				password: pulumi.secret(credentials.password)
			};
		});

	return { repository, registry };
}

const repositoryName = config.require("repositoryName");
const repository = createRepository(repositoryName);

const image = new buildx.Image(`${appName}-image`, {
	tags: [pulumi.interpolate`${repository.repository.repositoryUrl}:latest`],
	dockerfile: {
		location: "./Dockerfile"
	},
	context: {
		location: "../../"
	},
	platforms: ["linux/amd64"],
	secrets: {
		aws_key_id: process.env.AWS_ACCESS_KEY_ID!,
		aws_secret_key: process.env.AWS_SECRET_ACCESS_KEY!
	},
	cacheFrom: [
		{
			registry: {
				ref: pulumi.interpolate`${repository.repository.repositoryUrl}:latest`
			}
		}
	],
	push: true,
	registries: [repository.registry]
});

export const imageRef = image.ref;

const namespace = new k8s.core.v1.Namespace(namespaceName, {
	metadata: {
		name: namespaceName
	}
});

new cloudflare.DnsRecord("CNAME-domain", {
	zoneId: process.env.CLOUDFLARE_ZONE_ID!,
	type: "CNAME",
	name: domain,
	content: cnameTarget,
	proxied: true,
	ttl: 1
});

const deployment = new k8s.apps.v1.Deployment(appName, {
	metadata: {
		namespace: namespace.metadata.name,
		name: appName
	},
	spec: {
		selector: {
			matchLabels: appLabels
		},
		replicas,
		strategy: {
			type: "RollingUpdate",
			rollingUpdate: {
				maxSurge: 1,
				maxUnavailable: 1
			}
		},
		template: {
			metadata: {
				labels: appLabels,
				annotations: {
					"ecr/image-digest": image.digest
				}
			},
			spec: {
				containers: [
					{
						name: appName,
						image: image.ref,
						imagePullPolicy: "Always",
						ports: [
							{
								containerPort: port,
								name: portName
							}
						],
						readinessProbe: {
							httpGet: {
								path: "/",
								port: portName
							},
							successThreshold: 2,
							periodSeconds: 10,
							timeoutSeconds: 5
						}
					}
				],
				imagePullSecrets: [{ name: "ecr-reg-creds" }]
			}
		}
	}
});

const service = new k8s.core.v1.Service(appName, {
	metadata: {
		namespace: namespace.metadata.name,
		name: appName,
		labels: appLabels
	},
	spec: {
		ports: [{ port: 80, targetPort: portName }],
		selector: appLabels
	}
});

const ingress = new k8s.networking.v1.Ingress(`${appName}-ingress`, {
	metadata: {
		namespace: namespace.metadata.name,
		name: `${appName}-ingress`
	},
	spec: {
		ingressClassName: "nginx",
		rules: [
			{
				host: domain,
				http: {
					paths: [
						{
							pathType: "Prefix",
							path: "/",
							backend: {
								service: {
									name: service.metadata.name,
									port: { number: 80 }
								}
							}
						}
					]
				}
			}
		]
	}
});

export const deploymentStatus = deployment.status;
export const ingressStatus = ingress.status;
