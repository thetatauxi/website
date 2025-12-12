# Getting Started with the Theta Tau Website

This guide will walk you through the process of setting up your own copy of the website and deploying it with Vercel.

## Forking the Repository

1. **Create a GitHub Account**
   - If you don't have one already, sign up at [GitHub](https://github.com)

2. **Fork the Repository**
   - Go to the original repository at `https://github.com/[previous-website-chair-github-username]/theta-tau`
   - Click the "Fork" button in the top-right corner
   - Select your account as the destination for the fork
   - Wait for GitHub to complete the forking process

3. **Clone Your Fork Locally**
   ```bash
   git clone https://github.com/[your-username]/theta-tau.git
   cd theta-tau
   ```

## Setting Up Vercel

1. **Access the Theta Tau Vercel Account**
   - You should have received the "Website Credentials and Access Information" Google Doc from your chapter's leadership
   - This document contains all necessary credentials and access details
   - Use the Vercel account credentials provided in the document to log in at [Vercel](https://vercel.com)
   - If you haven't received access to this document, contact your chapter's leadership
     
2. **Connect Repository Host on Vercel**
   - Go to Theta Tau's Vercel dashboard
   - Click the project "theta-tau"
   - Go to "Settings"
   - Under "Git" section, click "Connected Git Repository"
   - Click "Disconnect" from the current repository
   - Click "Connect Git Repository"
   - Select your forked repository from your GitHub account
   - Vercel will automatically detect it as a Next.js project

3. **Override Previous Website (if needed)**
   - In the Vercel project settings, go to "Domains"
   - You will see the existing domain configuration
   - Your deployment will automatically override the previous website
   - No additional configuration is needed as the domain is already set up

4. **Deploy**
   - Click "Deploy"
   - Wait for the initial deployment to complete
   - Your website will now be live at the chapter's domain

## Connecting Custom Domain (Optional)

1. **Add Custom Domain**
   - In your Vercel project dashboard, go to "Settings" → "Domains"
   - Click "Add Domain"
   - Enter your domain name (e.g., "thetatau.org")
   - Follow Vercel's instructions for DNS configuration

2. **Configure DNS**
   - Log in to your domain registrar
   - Add the required DNS records provided by Vercel
   - Wait for DNS propagation (can take up to 48 hours)

## Automatic Deployments

Vercel will automatically deploy changes when you:
1. Push to the main branch of your repository

To make changes:
```bash

# Make your changes...

# Commit your changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push
```

## Managing Environment Variables

1. **Local Environment**
   - Copy the environment variables from the "Website Credentials and Access Information" Google Doc
   - Paste these values into your `.env.local` file

2. **Vercel Environment**
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables" in settings
   - Add each required variable
   - Redeploy your project for changes to take effect

## Troubleshooting Deployment

1. **Build Failures**
   - Check the build logs in Vercel
   - Ensure all dependencies are properly listed in `package.json`
   - Verify environment variables are set correctly

2. **Preview Deployments**
   - Each pull request gets a preview deployment
   - Use these to verify changes before merging to main

3. **Rolling Back**
   - In Vercel dashboard, go to "Deployments"
   - Find the last working deployment
   - Click "..." → "Promote to Production"

## Best Practices

1. **Version Control**
   - Always create branches for new features
   - Write clear commit messages
   - Review changes before pushing

2. **Testing**
   - Test locally before pushing
   - Use preview deployments to verify changes
   - Check mobile responsiveness

3. **Security**
   - Never commit sensitive information
   - Use environment variables for secrets
   - Regularly update dependencies

## Need Help?

If you encounter any issues:
1. Ask ChatGPT or any AI chatbot
2. Check the [Vercel Documentation](https://vercel.com/docs)
3. Contact the previous website chair

Happy coding!
