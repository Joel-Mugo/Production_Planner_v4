# Production_Planner_v4
Version 4 of the production planner. Help from gemini



Kutoka Fairoils BI Platform - Deployment Guide

This guide provides the complete step-by-step process for deploying your BI platform.
Part 1: Local Project Setup

    Create Project Folder: Create a new folder on your computer named kutoka-fairoils-bi.

    Download Files: Download all the files I've provided into this folder, maintaining the directory structure (app/api/sales_orders/route.js, etc.).

    Open Terminal: Open your command line or terminal inside the kutoka-fairoils-bi folder.

    Install Dependencies: Run the following command. This will read package.json and install Next.js, React, and the Google BigQuery library.

    npm install

Part 2: Google Cloud & BigQuery Setup

    Enable BigQuery API: Go to the Google Cloud Console, select your project, and ensure the "BigQuery API" is enabled.

    Create Service Account: This is a secure identity for your application.

        In the Cloud Console, go to "IAM & Admin" > "Service Accounts".

        Click "+ CREATE SERVICE ACCOUNT".

        Name: bi-platform-backend

        Grant these two roles: BigQuery Data Editor and BigQuery User.

        Click "Done".

    Generate Security Key:

        Find the new service account, click the three-dots menu > "Manage keys".

        Click "ADD KEY" > "Create new key" and select JSON.

        A .json file will be downloaded. This is your app's password to access the database. Keep it secure.

    Set Up BigQuery Tables:

        Go to the BigQuery section in your Cloud Console.

        Create a new Dataset with the ID production_planner.

        Inside the dataset, run SQL queries to create your tables. Here's the query for sales_orders. Create the others based on the data structure in our app.

        CREATE TABLE production_planner.sales_orders (
            id STRING,
            client STRING,
            sales_order_number STRING,
            client_po_number STRING,
            product STRING,
            qty INT64,
            order_date DATE,
            expected_dispatch_date DATE,
            actual_dispatch_date DATE,
            status STRING,
            timestamp TIMESTAMP
        );

Part 3: Connect Your Local App to BigQuery

    Create .env.local file: In the root of your project, create a new file named .env.local.

    Add Credentials: Open the .json key file you downloaded from Google Cloud, copy its entire contents, and paste it into .env.local like this:

    GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type": "service_account", "project_id": "...", ...}'
    GCP_PROJECT_ID="your-gcp-project-id"

        Replace your-gcp-project-id with your actual project ID.

        Ensure the JSON content is all on one line and enclosed in single quotes.

    Update API Route for Local Use: For local development, you'll need to slightly modify the BigQuery client initialization in app/api/sales_orders/route.js to parse this variable.

    // In app/api/sales_orders/route.js
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    const bigquery = new BigQuery({
        projectId: process.env.GCP_PROJECT_ID,
        credentials,
    });

    Run Locally: Start the app and test the connection.

    npm run dev

    Open http://localhost:3000. The Sales Orders page should now load data directly from your BigQuery table.

Part 4: Deploy to Vercel

    Create GitHub Repository: Create a new, empty repository on your GitHub account.

    Push Your Code: In your local project terminal, initialize Git and push your code.

    git init
    git add .
    git commit -m "Initial commit of BI Platform"
    git branch -M main
    git remote add origin [https://github.com/YourUsername/YourRepoName.git](https://github.com/YourUsername/YourRepoName.git)
    git push -u origin main

    Import to Vercel:

        Log in to Vercel and click "Add New..." > "Project".

        Select your new GitHub repository. Vercel will automatically configure it as a Next.js project.

    Set Production Environment Variables: This is the most important step for security.

        In the Vercel project settings, go to "Environment Variables".

        Add a variable named GCP_PROJECT_ID with your project ID.

        Add another variable named GOOGLE_APPLICATION_CREDENTIALS_JSON. For the value, paste the entire content of your .json key file.

    Deploy: Click the "Deploy" button. Vercel will build and launch your application on a public URL.

Your application is now live, secure, and fully connected to your BigQuery database.
