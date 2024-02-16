# SIMPLE DRIVE

## Overview
Simple cloud storage application backed by AWS S3.

## Features
* Folder Creation: Users can create folders to organize their files.
* File Upload: Upload files to the application for storage.
* File and Folder Management: Change the names of files and folders, navigate between different folders via breadcrumb menu.
* File Download: Download files and folders from the application to local storage.
* File and Folder Deletion: Delete unwanted files and folders from the application.
  
### Technologies
- Languages: TypeScript, HTML, CSS
- Frameworks: Node.js, Next.js, React, NestJS, Prisma
- Development Tools: AWS S3, SQLite

## Images

<img src="https://github.com/Huy-GV/SimpleCloudStorage/assets/78300296/c5eedd96-4178-42f6-8479-db0c3bc3fb91" width=60% alt="image">

## Build and Run Locally
### Pre-requisites
- Install [Node.js](https://nodejs.org/en/download/current)
- Install dependencies by running this command in `/backend` and `/frontend`:
    ```bash
    npm install
    ```

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
- Set up environment file `dev.env` in `/backend/src`:
    ```env
    JWT_SECRET=YOUR_32_CHARACTER_SECRET
    AWS_ACCESS_KEY=YOUR_AWS_ACCESS_KEY
    AWS_SECRET_KEY=YOUR_AWS_SECRET_KEY
    AWS_BUCKET=YOUR_AWS_BUCKET
    AWS_REGION=YOUR_AWS_REGION
    CLIENT_URLS=YOUR_REACT_CLIENT_URL
    ```
- Set up environment file `.env` for Prisma in `/backend/src/data/models/`
    ```env
    DATABASE_URL="file:YOUR/PATH/TO/DATABASE/FILE.db"
    ```
- Start the backend:
    ```bash
    cd ./backend
    # development
    npm run start

    # watch mode
    npm run start:dev

    # production mode
    npm run start:prod
    ```
