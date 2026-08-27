// index.js
require('dotenv').config();
const { Client, Collection, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const axios = require('axios');

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const SPOTIFY_API_KEY = process.env.SPOTIFY_API_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'spotify-downloader12.p.rapidapi.com';

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing BOT_TOKEN or CLIENT_ID in environment. Exiting.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Register all commands including Spotify downloader
const commands = [
  new SlashCommandBuilder()
    .setName('roblox')
    .setDescription('Look up a Roblox user profile')
    .addStringOption(option =>
      option.setName('username').setDescription('Username to search').setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('minecraft')
    .setDescription('Look up a Minecraft user profile')
    .addStringOption(option =>
      option.setName('username').setDescription('Username to search').setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('discord')
    .setDescription('Look up a Discord user profile')
    .addStringOption(option =>
      option.setName('id').setDescription('Discord user ID').setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('spotify')
    .setDescription('Download Spotify tracks as MP3 (use responsibly)')
    .addStringOption(option =>
      option.setName('url').setDescription('Spotify track URL').setRequired(true))
].map(cmd => cmd.toJSON());

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Register commands globally (or switch to guild commands for faster propagation during dev)
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'roblox') {
    const username = interaction.options.getString('username');
    await handleRoblox(interaction, username);
  } else if (commandName === 'minecraft') {
    const username = interaction.options.getString('username');
    await handleMinecraft(interaction, username);
  } else if (commandName === 'discord') {
    const id = interaction.options.getString('id');
    await handleDiscord(interaction, id);
  } else if (commandName === 'spotify') {
    const url = interaction.options.getString('url');
    await handleSpotify(interaction, url);
  }
});

async function handleSpotify(interaction, url) {
  // Validate URL
  if (!url.includes('open.spotify.com') && !url.includes('spotify.com')) {
    await interaction.reply({ content: '❌ Please provide a valid Spotify URL.', ephemeral: true });
    return;
  }

  if (!SPOTIFY_API_KEY) {
    await interaction.reply({ content: '❌ Spotify downloader API key is not configured. Set SPOTIFY_API_KEY in environment variables.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ content: '🎵 Downloading track...' });

  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await axios.get(`https://${RAPIDAPI_HOST}/convert?urls=${encodedUrl}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': SPOTIFY_API_KEY
      },
      timeout: 30_000
    });

    const data = response.data;
    
    // Build track info embed
    const trackEmbed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle(data.title || 'Unknown Track')
      .setURL(url)
      .setThumbnail(data.image || null)
      .addFields(
        { name: '���� Artist', value: data.artist || 'Unknown Artist', inline: true },
        { name: '⏱️ Duration', value: data.duration || 'Unknown', inline: true },
        { name: '🔗 Download Link', value: data.url ? `[Direct Download](${data.url})` : 'Not available' }
      )
      .setFooter({ text: 'Spotify Track Downloader' });

    await interaction.editReply({ 
      content: `✅ Found **${data.title || 'Track'}** by ${data.artist || 'Unknown'}`,
      embeds: [trackEmbed]
    });
    
  } catch (error) {
    console.error('Spotify download error:', error.response?.data || error.message);
    
    await interaction.editReply({ 
      content: '❌ There was an error downloading the track. Please check the URL, your API key, or try again later.'
    });
  }
}

async function handleRoblox(interaction, username) {
  try {
    const res = await axios.get(`https://users.roblox.com/v2/users?usernames=${encodeURIComponent(username)}&excludeBannedUsers=true`);
    const user = res.data.data?.[0];

    if (!user) {
      await interaction.reply({ content: '❌ User not found on Roblox.', ephemeral: true });
      return;
    }

    const profileRes = await axios.get(`https://users.roblox.com/v1/users/${user.id}`);
    const profile = profileRes.data;
    const avatarUrl = `https://tr.rbxcdn.com/${user.id}/avatar-thumbnail/150/150.png`;

    const embed = new EmbedBuilder()
      .setColor('#00AFF2')
      .setTitle(user.displayName || user.name)
      .setURL(`https://www.roblox.com/users/${user.id}/profile`)
      .setThumbnail(avatarUrl)
      .addFields(
        { name: '🔍 Username', value: `\`${user.name}\``, inline: true },
        { name: '🆔 User ID', value: `\`${user.id}\``, inline: true },
        { name: '📅 Join Date', value: `<t:${Math.floor(new Date(user.created).getTime() / 1000)}:D>`, inline: false },
        { name: '📝 Bio', value: profile.bio || 'No bio available' },
        { name: '👥 Friend Count', value: profile.friendCount ? `${profile.friendCount}` : 'Private' }
      )
      .setFooter({ text: 'Roblox Profile Lookup' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Roblox error:', error.message || error);
    await interaction.reply({ content: '❌ There was an error fetching Roblox data.', ephemeral: true });
  }
}

async function handleMinecraft(interaction, username) {
  try {
    const res = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
    const { name, id } = res.data;

    const uuidFormatted = `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`;

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(name)
      .setThumbnail(`https://crafatar.com/renders/head/${id}.png`)
      .addFields(
        { name: '🎮 Username', value: `\`${name}\``, inline: true },
        { name: '🆔 UUID', value: `\`${uuidFormatted}\``, inline: true },
        { name: '🔗 Profile', value: `[View on Namemc](https://namemc.com/profile/${id})` },
        { name: '🖼️ Skin Preview', value: `[Crafatar Avatar](https://crafatar.com/avatar/${id}.png)` }
      )
      .setFooter({ text: 'Minecraft Profile Lookup' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Minecraft error:', error.message || error);
    await interaction.reply({ content: '❌ Could not find that Minecraft user.', ephemeral: true });
  }
}

async function handleDiscord(interaction, id) {
  try {
    const user = await interaction.client.users.fetch(id);
    
    const embed = new EmbedBuilder()
      .setColor(user.hexAccentColor || '#FFFFFF')
      .setTitle(user.tag)
      .setThumbnail(user.displayAvatarURL({ extension: 'png', size: 256 }))
      .addFields(
        { name: '🆔 ID', value: `\`${user.id}\``, inline: true },
        { name: '🤖 Bot?', value: user.bot ? '✅ Yes' : '❌ No', inline: true },
        { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>` },
        { name: '🔗 Actions', value: `[Message](https://discord.com/channels/@me/${user.id}) | [Profile](https://discordapp.com/users/${user.id})` }
      )
      .setFooter({ text: 'Discord User Lookup' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Discord lookup error:', error.message || error);
    await interaction.reply({ content: '❌ Could not find that Discord user.', ephemeral: true });
  }
}

client.login(TOKEN);
