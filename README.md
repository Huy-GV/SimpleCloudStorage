# SIMPLE CLOUD STORAGE

## Overview
Simple cloud storage application backed by AWS S3.

<img src="https://github.com/Huy-GV/SimpleCloudStorage/assets/78300296/41e13876-a74d-4e88-a987-01655c41611e" width=70% alt="image">

## Features
- Folder Creation: Users can create folders to organize their files.
- File Upload: Upload files to the application for storage.
- File and Folder Management: Change the names of files and folders, navigate between different folders via breadcrumb menu.
- File Download: Download files and folders from the application to local storage.
- File and Folder Deletion: Delete unwanted files and folders from the application.

### Technologies
- Languages: TypeScript, HTML, CSS, Bash
- Frameworks: React, Next.js, Tailwind CSS, NestJS, Prisma
- Development Tools: PostgreSQL, AWS S3, VPC, RDS, CodePipeline, ECR, ECS, SSM, IAM

## Build and Run Locally
### Pre-requisites
- Install [Node.js](https://nodejs.org/en/download/current)
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
- Set up environment file `.env.development.local` in `./backend/src`:
    ```env
    CLIENT_URLS=YOUR_REACT_CLIENT_URL
    JWT_SECRET=YOUR_32_CHARACTER_SECRET

    AWS_ACCESS_KEY=YOUR_AWS_ACCESS_KEY
    AWS_SECRET_KEY=YOUR_AWS_SECRET_KEY
    AWS_BUCKET=YOUR_AWS_BUCKET
    AWS_REGION=YOUR_AWS_REGION

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
    - Run `set-ssm-params.sh` store all production environment variables from your local `.env` file in AWS SSM parameters:
        ```bash
        set-ssm-params.sh ./.env.prod.aws
        ```
- Note: HTTPS is currently not supported, and neither is HTTP cookies so JWTs are currently stored in web storage, and the deployed application can only be run with web security disabled

### VPC
- Subnets
    - public subnet with a NAT gateway (required by CodeBuilder projects)
    - private subnet with a route to the NAT gateway
- Security groups
    - `web-tier-sg`: allows inbound HTTP traffic
    - `db-tier-sg`: allows inbound PostgreSQL traffic from `web-tier-sg`

### CodePipeline
- CodeBuildProjects
    - `BuildBackend`
        - Subnet: private
        - SG: `web-tier-sg`
    - `BuildFrontend`
- Source Stage: GitHub repository
- Build Stage:
    - Build the backend with `backend-buildspec.yml`
        - Ensure the CodeBuild project can run in privileged mode so it can build a Docker container
        - Ensure the RDS instance is running as the build stage involves migrating the database
        - Ensure the ECR repository already exists as a Docker image will be pushed after the build finishes
        - Ensure the ECS service runs at least 1 task
    - Build the frontend with `frontend-buildspec.yml`
- Deploy stage:
    - Deploy the frontend into S3
    - Deploy the backend into ECS
        - Ensure the backend is already deployed as the server URL is baked into the code during the build by Next.js

### RDS
- Engine type: RDS
- Security group: `db-tier-sg`

### ECS
- Cluster name: `SimpleCloudStorageCluster`
- Service name: `ScsService`
- Container ports: 80 and 5432
- Environment file: `arn:aws:s3:::scs-ecs-env/aws.env`
    - Bucket and `aws.env` are created by the frontend build stage

## IAM Profile
- CodeBuilder backend service
    - AWS Managed policy: `AmazonEC2ContainerRegistryPowerUser`
    - Custom inline role
        ```json
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Statement1",
                    "Effect": "Allow",
                    "Action": [
                        "ssm:GetParameter*"
                    ],
                    "Resource": [
                        "arn:aws:ssm:$YOUR_REGION:$YOUR_ACCOUNT_ID:parameter/*"
                    ]
                },
                {
                    "Sid": "Statement2",
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetBucketLocation",
                        "s3:CreateBucket",
                        "s3:PutObject"
                    ],
                    "Resource": [
                        "arn:aws:s3:::*"
                    ]
                }
            ]
        }
        ```
- CodeBuilder frontend service custom inline role
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "Statement1",
                "Effect": "Allow",
                "Action": [
                    "ssm:GetParameter*"
                ],
                "Resource": [
                    "arn:aws:ssm:$YOUR_REGION:$YOUR_ACCOUNT_ID:parameter/*"
                ]
            },
            {
                "Sid": "Statement2",
                "Effect": "Allow",
                "Action": [
                    "ecs:ListTasks",
                    "ecs:DescribeTasks",
                    "ecs:DescribeServices"
                ],
                "Resource": [
                    "arn:aws:ecs:$YOUR_REGION:$YOUR_ACCOUNT_ID:*/*"
                ]
            },
            {
                "Sid": "Statement3",
                "Effect": "Allow",
                "Action": [
                    "ec2:DescribeNetworkInterfaces"
                ],
                "Resource": [
                    "*"
                ]
            }
        ]
    }
    ```
