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

### Supported AI Providers

- **Google Gemini 2.0 Flash** (Currently Configured): 
  - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
  - Get your API key from: [Google AI Studio](https://makersuite.google.com/app/apikey)
  - Latest model with improved performance and speed
  - Free tier available with generous limits
- **OpenAI**: Use `https://api.openai.com/v1/chat/completions` with your OpenAI API key
- **Anthropic**: Use `https://api.anthropic.com/v1/messages` with your Anthropic API key  
- **Custom/Local APIs**: Configure your own endpoint

### Troubleshooting AI Issues

If you encounter "Unexpected end of JSON input" errors:

1. Check that your `MODEL_API_URL` is correct and accessible
2. Verify your `MODEL_API_KEY` is valid and not expired
3. For Gemini API: Get a fresh API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. Ensure your AI provider is returning valid JSON responses
5. Check the browser console and Netlify function logs for detailed error messages

**Common Issues:**
- **API Key Expired**: Gemini API keys can expire - generate a new one
- **Rate Limits**: Check if you've exceeded your API quota
- **Network Issues**: Ensure your deployment can access external APIs

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/6b59d567-db23-48cc-8212-e3909708b0a4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
