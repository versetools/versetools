ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-bookworm AS base

# PNPM
ARG PNPM_VERSION=10
ARG PNPM_STORE=/pnpm/store

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g corepack@latest --force
RUN corepack enable
RUN corepack prepare pnpm@${PNPM_VERSION} --activate

RUN --mount=type=cache,id=pnpm,target=${PNPM_STORE} \
    pnpm config set store-dir ${PNPM_STORE}

# AWS CLI
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends python3 curl zip

RUN curl --insecure "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

FROM base AS installer

WORKDIR /app
COPY . .
    
ENV AWS_DEFAULT_REGION=eu-central-1

RUN --mount=type=secret,id=aws_key_id,env=AWS_ACCESS_KEY_ID \
    --mount=type=secret,id=aws_secret_key,env=AWS_SECRET_ACCESS_KEY \
    aws codeartifact --region eu-central-1 login --tool npm --repository versetools --domain packages --namespace @versetools && \
    aws codeartifact --region eu-central-1 login --tool npm --repository l3dev-private --domain packages --namespace @l3dev-private

RUN --mount=type=cache,id=pnpm,target=${PNPM_STORE} \
    pnpm install --frozen-lockfile

FROM installer AS builder

ARG PUBLIC_POSTHOG_KEY
ENV PUBLIC_POSTHOG_KEY=$PUBLIC_POSTHOG_KEY

RUN pnpm --filter=./packages/** build
RUN pnpm --filter=docs build
RUN pnpm deploy --filter=docs --prod --legacy /prod

FROM busybox:latest

RUN adduser -D static
USER static

WORKDIR /home/static

COPY --from=builder /prod/build .

EXPOSE 3000
CMD [ "busybox", "httpd", "-f", "-v", "-p", "3000" ]
