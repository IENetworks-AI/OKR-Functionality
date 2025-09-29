# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/6b59d567-db23-48cc-8212-e3909708b0a4

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6b59d567-db23-48cc-8212-e3909708b0a4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Netlify Functions (for AI integration)

## AI Configuration

This project includes AI-powered OKR suggestions. To enable this feature:

1. Copy `.env.example` to `.env.local`
2. Configure your AI model API settings:
   ```
   MODEL_API_URL=https://api.your-provider.com/v1/generate
   MODEL_API_KEY=your-api-key
   MODEL_NAME=your-model-name
   ```

### Backend Configuration

This application is configured to use a FastAPI backend server for AI-powered OKR suggestions:

- **Backend Server**: `http://172.20.30.72` (accessed via Vite proxy)
- **Proxy Setup**: Requests are proxied through `/api/backend/*` to avoid CORS issues
- **Endpoints**:
  - `/chat` - Generate key results from objectives
  - `/weekly-plan` - Generate weekly tasks from key results  
  - `/daily-plan` - Generate daily tasks from annual key results
- **No API keys required** - Backend handles all AI processing

### Troubleshooting Backend Issues

If you encounter connection or response errors:

1. Ensure your FastAPI backend server is running on `http://172.20.30.72`
2. Check that all three endpoints (`/chat`, `/weekly-plan`, `/daily-plan`) are accessible
3. Verify the backend is returning valid JSON responses
4. Check the browser console for detailed error messages
5. Ensure your backend server supports CORS for the frontend domain

**Common Issues:**
- **Connection Refused**: Backend server may be down or unreachable
- **CORS Errors**: Backend needs to allow requests from your frontend domain
- **Invalid Response Format**: Backend should return JSON with expected structure
- **Network Issues**: Check firewall and network connectivity to the backend

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/6b59d567-db23-48cc-8212-e3909708b0a4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
