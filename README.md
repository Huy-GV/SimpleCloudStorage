# SIMPLE CLOUD STORAGE

## Overview
Simple cloud storage application backed by AWS S3.

## Features
- Folder Creation: Users can create folders to organize their files.
- File Upload: Upload files to the application for storage.
- File and Folder Management: Change the names of files and folders, navigate between different folders via breadcrumb menu.
- File Download: Download files and folders from the application to local storage.
- File and Folder Deletion: Delete unwanted files and folders from the application.

### Technologies
- Languages: TypeScript, HTML, CSS
- Frameworks: React, Next.js, Tailwind CSS, NestJS, Prisma
- Development Tools: AWS S3, PostgreSQL

## Images

<img src="https://github.com/Huy-GV/SimpleCloudStorage/assets/78300296/41e13876-a74d-4e88-a987-01655c41611e" width=60% alt="image">

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
- Set up environment file `.env` in `/frontend/:
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
    ```
- Create a PostgreSQL database:
    ```bash
    psql
    CREATE DATABASE simple_cloud_storage;
    ```
- Migrate PostgreSQL database with Prisma in `./backend/src/data/models/`
    ```bash
    dotenv -e ../../../.env.development.local -- npx prisma migrate dev
    ```
- Start the backend:
    ```bash
    cd ./backend
    npm run start:dev
    ```
