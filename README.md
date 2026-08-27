# Discord Lookup Bot

A Discord bot that provides:
- Roblox user profile lookup
- Minecraft username/UUID lookup
- Discord user lookup
- (Optional) Spotify track downloader via a RapidAPI Spotify-downloader endpoint

WARNING: Do not commit your .env file or tokens to source control. Revoke/rotate any token/API key that was publicly exposed.

## Requirements

- Node 18+
- A Discord bot application (bot token + client ID)
- (Optional) RapidAPI key for the Spotify downloader service

## Setup (local)

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in your credentials.
   - BOT_TOKEN
   - CLIENT_ID
   - SPOTIFY_API_KEY (optional; required for `/spotify`)
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## Deploying to Railway

1. Create a new project on Railway and connect your GitHub repo (or link via CLI).
2. Set environment variables in Railway settings:
   - BOT_TOKEN
   - CLIENT_ID
   - SPOTIFY_API_KEY (if you wish to use the /spotify command)
   - RAPIDAPI_HOST (optional)
3. Ensure start command is `npm start` (Procfile included).
4. Deploy.

## Notes & Security

- The Spotify downloader endpoint may violate Spotify's Terms of Service. Make sure you have the right to download and redistribute any track and that your usage complies with the API/service provider's terms.
- If you ever expose your bot token publicly (for example, posted in a message), regenerate it from the Discord Developer Portal immediately.
- Keep any API keys secret.

## Want me to push these files into the repository?

I can push them for you. If you'd like that, confirm and accept the authorization prompt (if one appears) and tell me to proceed. Alternatively, to push them yourself, run the commands below.

How to push these files yourself (quick commands)

- Option A — clone and add files:
  1. Clone the empty repo:
     - HTTPS: git clone https://github.com/herbleedingveins/discord-lookup-bot.git
     - or SSH: git clone git@github.com:herbleedingveins/discord-lookup-bot.git
  2. Copy the files above into the repo folder.
  3. Commit & push:
     git add .
     git commit -m "Initial project files"
     git push origin main

- Option B — create locally and push to the created remote:
  1. Create a local folder and add the files.
  2. git init
     git branch -M main
     git remote add origin https://github.com/herbleedingveins/discord-lookup-bot.git
     git add .
     git commit -m "Initial project files"
     git push -u origin main
