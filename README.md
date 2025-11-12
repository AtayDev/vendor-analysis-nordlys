<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1KH5BnXSZH4oCqAj_aiEz9WVqVr8SzU11

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and configure:
   - `GEMINI_API_KEY` with your Gemini API key.
   - `VITE_AUTH_SECRET` with a strong, random string used to sign login tokens.
   - `TOKEN_TTL_DAYS` to control how long generated access tokens remain valid (defaults to 3 days).
3. Generate a login token:
   `npm run generate-token`

   The script reads your `.env.local` configuration and prints a signed token along with its expiration timestamp. Pass `--days=<number>` to override the default lifespan for a single token.
4. Share the generated token with authorized users and run the app:
   `npm run dev`
