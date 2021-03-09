# discord-bot
## Getting Started
Download or clone the repository https://github.com/wesherwo/discord-bot.git

Install node.js from https://nodejs.org/en/

Run `npm install` to install required dependancies.

## Setting up a bot
Go to https://discordapp.com/developers/applications/ and create a new application.
Next go to OAuth2 and under scopes select bot.
Go to the link under scopes and add the bot to your server.
Navigate to the Bot tab under settings.
Click to reveal your token and copy it.
Replace the X's with your token in the settings.json after token

For the gameData.js to work you will also need to enable the Privileged Gateway Intents under the Bot section. (Presence Intent and Server Members Intent)

## Youtube API key
Go to https://developers.google.com/youtube/v3/getting-started and follow the instructions to get your API key
Replace the X's with your key in the settings.json after YTtoken

## Set personal settings
Open the `settings.json` file and replace the X's with your token.
Change the prefix to whatever prefix you would like.

## Run the bot
Run `node index` to start the bot.

## Setting admin commands
In discord type in your prefix followed by `addadmincommand addadmincommand` followed by a space and then type in what role you want to be able to use settings commands.
#### OR
Open the `settings.json` file and add `"settings": ["role1","role2",...]` inside the {} for admincommands.  You need to get the role id from server settings in Discord and replace the `["role1","role2",...]` with `["id", "id",...]`.

## Setting a default channel
Open the `Resources/ModuleResources/tournyOW.json` and chnage the X's for defaultChannel with the name of the voice channel that you want to be the default.

## FFMPEG is not installed on the machine running the bot
The play command requires FFMPEG to be installed on the machine that is running the bot. You can download it on the official FFMPEG website. Note: This isn't relevant if you use the Dockerfile because it will install FFMPEG inside of the container.
