Kutoka Fairoils BI Platform: Deployment Guide

This guide provides the complete, step-by-step instructions to take your Next.js application from your local machine to a live, production-ready deployment.

We will use a modern and efficient stack:

    Database: Google BigQuery

    Code Repository: GitHub

    Hosting: Vercel

Phase 1: Google Cloud - Create a Secure Key for Your App

To allow your Vercel-hosted application to securely talk to your BigQuery database, we need to create a "Service Account." Think of this as giving your app its own secure, non-human user account with very specific permissions.
Step 1: Create the Service Account

    Go to the Google Cloud Console and navigate to IAM & Admin > Service Accounts.

    Click "+ CREATE SERVICE ACCOUNT" at the top.

    Service account name: Enter kutoka-fairoils-bi-app (or a similar descriptive name).

    Click "CREATE AND CONTINUE".

Step 2: Grant BigQuery Permissions

    In the "Grant this service account access to project" section, click the "Role" dropdown.

    Search for and select the BigQuery Data Editor role. This allows the app to read and write data.

    Click "+ ADD ANOTHER ROLE".

    Search for and select the BigQuery Job User role. This allows the app to run queries.

    Click "CONTINUE", then "DONE".

Step 3: Generate the JSON Key

This key is like a password for your app. You must keep it secret.

    On the Service Accounts page, find the account you just created.

    Click the three dots under "Actions" and select "Manage keys".

    Click "ADD KEY" > "Create new key".

    Select JSON as the key type and click "CREATE".

    A JSON file will be downloaded to your computer. This is your service account key. Keep it safe.

Phase 2: GitHub - Securely Store Your Key

You must NEVER commit the JSON key file directly to your GitHub repository. Instead, we will use GitHub's "Repository Secrets" feature.

    Open your project's repository on GitHub.

    Go to "Settings" > "Secrets and variables" > "Actions".

    Click the "New repository secret" button.

    Name: GOOGLE_APPLICATION_CREDENTIALS_JSON

    Secret: Open the JSON key file you downloaded from Google Cloud, copy its entire contents, and paste it into this box.

    Click "Add secret".

Your secret key is now securely stored and ready to be used by Vercel.
Phase 3: Vercel - Deploy Your Application

This is the final phase where your application goes live.
Step 1: Import Your Project

    Go to your Vercel Dashboard.

    Click "Add New..." > "Project".

    Find your kutoka-fairoils-bi GitHub repository and click "Import".

Step 2: Configure Environment Variables

This is where you tell Vercel how to find your project ID and the secret key it needs to connect to BigQuery.

    In the "Configure Project" screen, expand the "Environment Variables" section.

    Add the first variable:

        Name: GCP_PROJECT_ID

        Value: Enter your Google Cloud Project ID (you can find this on the main dashboard of your Google Cloud Console).

    Add the second variable:

        Name: GOOGLE_APPLICATION_CREDENTIALS_JSON

        Value: Paste the entire contents of the JSON key file you downloaded earlier.

    Ensure both variables are selected to be used in all environments (Production, Preview, Development).

Step 3: Deploy!

    Click the "Deploy" button.

    Vercel will now start the build process. It will install the dependencies from your package.json, build the Next.js application, and deploy it to its global network.

    You can watch the build logs in real-time. The process usually takes 1-2 minutes.

Once it's finished, you will see a "Congratulations!" screen with a screenshot of your live application. Vercel will provide you with the public URL where your application is now accessible to the world.

Congratulations! Your BI Platform is now live. From now on, every time you git push a change to your main branch on GitHub, Vercel will automatically redeploy the latest version of your application.
