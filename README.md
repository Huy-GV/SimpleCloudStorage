# SIMPLE CLOUD STORAGE

## Overview
Simple cloud storage application backed by AWS S3.

<img src="https://github.com/Huy-GV/SimpleCloudStorage/assets/78300296/b81be489-e5d4-48f2-9292-25b4654ac736" width=60% alt="image">

## Features
- Folder Creation and File Upload
- File and Folder Management: Change the names of files and folders, navigate between different folders via breadcrumb menu, download and delete files/folders.

### Technologies
- Languages: TypeScript, HTML, CSS, Bash
- Frameworks: React, Next.js, Tailwind CSS, NestJS, Prisma
- Development Tools: PostgreSQL, AWS CDK, S3, VPC, RDS, CodeBuild, CodePipeline, ECR, ECS Fargate, SSM, IAM, CloudFront, Route 53

## Build and Run Locally
### Pre-requisites
- Install [Node.js v20.14.0 LTS](https://nodejs.org/en/download/current)
- Install `dotenv-cli` globally:
    ```bash
    npm install -g dotenv-cli
    ```
- Install dependencies by running this command in `/backend` and `/frontend`:
    ```bash
    npm install
    ```
- Install [PostgreSQL](https://www.postgresql.org/download/)

### Frontend
- Set up environment file `.env.development` in `/frontend/:
    ```env
    NEXT_PUBLIC_SERVER_URL=http://localhost:5000
    ```
- Start the frontend:
    ```bash
    npm run dev
    ```

### Backend
- Set up a local IAM profile to use S3 client
    ```bash
    aws configure --profile simple-cloud-storage
    export AWS_PROFILE=simple-cloud-storage
    ```
- Set up environment file `.env.development.local` in `./backend/src`:
    ```env
    JWT_SECRET=YOUR_32_CHARACTER_SECRET

    DATA_BUCKET_AWS=YOUR_AWS_BUCKET
    REGION_AWS=YOUR_AWS_REGION

    DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_SERVER:5432/YOUR_DATABASE_NAME"
    SERVER_PORT=YOUR_SERVER_PORT
    DOWNLOAD_DIR=YOUR_TEMPORARY_DOWNLOAD_DIR
    ```
- Create a PostgreSQL database:
    ```bash
    psql
    CREATE DATABASE simple_cloud_storage;
    ```
- Migrate PostgreSQL database with Prisma in `./backend/src/data/models/`
    ```bash
    cd ./backend/src/data/models/
    npx dotenv -e ../../../.env.development.local -- npx prisma migrate dev
    ```
- Start the backend:
    ```bash
    npm run start:dev
    ```

## Deploy on AWS
### Overview
- The application can be built and deployed automatically using a CI/CD service from AWS
    - 2 separate AWS pipelines are used to build and deploy the client and server
    - The server is deployed as a container running on ECS Fargate
    - The client is deployed as a static website in an Amazon S3 bucket and served by CloudFront
    - The database runs on RDS with PostgreSQL as the engine

### Deployment steps:
1. Obtain a HTTPS certificate using ACM and Route 53 then configure an .env file in `infrastructure/bin`
    ```env
    Aws__CertificateArn=your.aws.cert.arn
    Aws__HostedZoneName=your.domain.name.com
    ```
2. Initialise AWS credentials:
    ```bash
    aws configure profile simple-cloud-storage
    export AWS_PROFILE=simple-cloud-storage
    cdk bootstrap
    ```
3. Provision AWS resources with `cdk deploy --all`
4. Create an `.env.production` file similar to the above example but with the following changes:
    - Changes:
        - `SERVER_PORT`: 80
    - Additions:
        - `SERVER_URL`: `<domain name>/api/v1`
        - `DATABASE_ENDPOINT`: RDS instance endpoint
        - `DATABASE_PASSWORD`: RDS instance password
        - `DATABASE_NAME`: RDS instance name
        - `DATABASE_USER`: RDS instance user
        - `ENV_BUCKET_AWS`: S3 bucket used to store `.env` file used by the ECS container as specified in [DataStoreStack](./infrastructure/lib/data-store-stack.ts)
        - `REPOSITORY_NAME`: ECR repository name specified in [ContainerStack.ts](./infrastructure/lib/container-stack.ts)
        - `CONTAINER_NAME`: ECS container name specified in [ContainerStack.ts](./infrastructure/lib/container-stack.ts)
        - `ACCOUNT_ID_AWS`: ID of AWS account, used to determine the ECR repository at build stage
    - Removals:
        - `DATABASE_URL` from `.env.production` since it is added in the CI/CD pipeline
5. Run `set-ssm-params.sh` to store all production environment variables from your local `.env` file in AWS SSM parameters:
    ```bash
    ./scripts/set-ssm-params.sh ./.env.production
    ```
    - The parameters set by SSM will be used to create `aws.env` stored in S3 and used by the Fargate service
6. Create another S3 bucket to host the frontend:
    - Enable website hosting and public access
    - Create a CloudFront distribution using a HTTPS certificate in the us-east-1 region
    - Create an origin access control and apply the generated policy to the S3 bucket
7. Release change on the backend and frontend pipelines
8. Set the desired task count to at least 1

### CodePipeline
- CodeBuildProjects
    - `BuildBackend`
        - Subnets: private subnets with egress
        - Security group: web tier
    - `BuildFrontend`: no networking configuration required
- Source Stage: GitHub repository
- Build Stage:
    - Build the backend with `backend-buildspec.yml`
    - Build the frontend with `frontend-buildspec.yml`
- Deploy stage:
    - Deploy the frontend into S3 bucket
    - Deploy the backend into ECS Fargate

### IAM Profile
- CodeBuilder backend service
    - AWS Managed policy: `AmazonEC2ContainerRegistryPowerUser`
    - Custom inline role: [./infrastructure/iam/codebuilder-backend-service-role.json](./infrastructure/iam/codebuilder-backend-service-role.json)
- CodeBuilder frontend service custom inline role:
    - Custom inline role:[./infrastructure/iam/codebuilder-frontend-service-role.json](./infrastructure/iam/codebuilder-frontend-service-role.json)
- CDK policies for current IAM user:
    - Bootstrap policy: [./infrastructure/iam/cdk-bootstrap-policy.json](./infrastructure/iam/cdk-bootstrap-policy.json)
    - Deploy Policy: [./infrastructure/iam/cdk-deploy-policy.json](./infrastructure/iam/cdk-deploy-policy.json)
