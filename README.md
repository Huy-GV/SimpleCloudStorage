# SIMPLE CLOUD STORAGE

## Overview
Simple cloud storage application backed by AWS S3.

<img src="https://github.com/Huy-GV/SimpleCloudStorage/assets/78300296/b1a63f41-39c3-4a5f-9d5f-7aeffa9bc919" width=70% alt="image">

## Features
- Folder Creation: Users can create folders to organize their files.
- File Upload: Upload files to the application for storage.
- File and Folder Management: Change the names of files and folders, navigate between different folders via breadcrumb menu.
- File Download: Download files and folders from the application to local storage.
- File and Folder Deletion: Delete unwanted files and folders from the application.

### Technologies
- Languages: TypeScript, HTML, CSS, Bash
- Frameworks: React, Next.js, Tailwind CSS, NestJS, Prisma
- Development Tools: PostgreSQL, AWS CDK, S3, VPC, RDS, CodeBuild, CodePipeline, ECR, ECS, SSM, IAM

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
    cd ./frontend
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
    CLIENT_URLS=YOUR_REACT_CLIENT_URL
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
    cd ./backend
    npm run start:dev
    ```

## Deploy on AWS
### Overview
- The application can be built and deployed automatically using a CI/CD service from AWS
    - 2 separate AWS pipelines are used to build and deploy the client and server
    - The server is deployed as a container running on ECS Fargate
    - The client is deployed as a static website in an Amazon S3 bucket
    - The database runs on RDS with PostgreSQL as the engine
- The build stage on AWS CodePipeline uses environment variables stored as SSM parameters
    - Create an `.env.production` file similar to the above example but with the following additions:
        - `DATABASE_ENDPOINT`: RDS instance endpoint
        - `DATABASE_PASSWORD`: RDS instance password
        - `DATABASE_NAME`: RDS instance name
        - `DATABASE_USER`: RDS instance user
        - `ENV_BUCKET_AWS`: S3 bucket used to store `.env` file used by the ECS container as specified in [./infrastructure/lib/data-store-stack.ts](./infrastructure/lib/data-store-stack.ts)
        - `REPOSITORY_NAME`: ECR repository name specified in [./infrastructure/lib/container-stack.ts](./infrastructure/lib/container-stack.ts)
        - `CONTAINER_NAME`: ECS container name specified in [./infrastructure/lib/container-stack.ts](./infrastructure/lib/container-stack.ts)
        - `ACCOUNT_ID_AWS`: ID of AWS account, used to determine the ECR repository at build stage
    - Remove `DATABASE_URL` from `.env.production` since it is added in the CI/CD pipeline
    - Run `set-ssm-params.sh` to store all production environment variables from your local `.env` file in AWS SSM parameters:
        ```bash
        ./scripts/set-ssm-params.sh ./.env.production
        ```
    - The parameters set by SSM will be used to create `aws.env` which is then uploaded to S3 and used by ECS
        - The build stage does this by running `upload-container-env.sh`
- To initialize AWS infrastructure, run the CDK project in [./infrastructure](./infrastructure/)
    - Bootstrap environment: `cdk bootstrap`
    - Deploy all: `cdk deploy --all`
    - Deploy individual stack: `cdk deploy <stack name>`

### HTTPS Support
- HTTPS is currently *not* supported, and neither is HTTP cookies so JWTs are currently stored in web storage, and the deployed application can only be run with web security disabled

### CodePipeline
- CodeBuildProjects
    - `BuildBackend`
        - Subnets: private with egress
        - Security group: web tier
    - `BuildFrontend`: no networking configuration required
- Source Stage: GitHub repository
- Build Stage:
    - Build the backend with `backend-buildspec.yml`
        - Set the desired number of ECS tasks to 1 at minimum
    - Build the frontend with `frontend-buildspec.yml`
- Deploy stage:
    - Deploy the frontend into S3
    - Deploy the backend into ECS
        - Ensure the backend is already deployed as the server URL is baked into the code during the build by Next.js

### IAM Profile
- CodeBuilder backend service
    - AWS Managed policy: `AmazonEC2ContainerRegistryPowerUser`
    - Custom inline role: [./infrastructure/iam/codebuilder-backend-service-role.json](./infrastructure/iam/codebuilder-backend-service-role.json)
- CodeBuilder frontend service custom inline role: [./infrastructure/iam/codebuilder-frontend-service-role.json](./infrastructure/iam/codebuilder-frontend-service-role.json)
- CDK policies for current IAM user:
    - Bootstrap policy: [./infrastructure/iam/cdk-bootstrap-policy.json](./infrastructure/iam/cdk-bootstrap-policy.json)
    - Deploy Policy: [./infrastructure/iam/cdk-deploy-policy.json](./infrastructure/iam/cdk-deploy-policy.json)
