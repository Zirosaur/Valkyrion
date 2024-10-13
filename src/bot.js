const fs = require('fs');
const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
require('dotenv').config();
const { handleVoiceStateChange } = require('./events/voiceEvents');
const { updateBotActivity } = require('./utils/activity'); // Impor fungsi dari activity.js

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

// Load commands
const loadCommands = () => {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    console.log(`Memuat ${commandFiles.length} perintah...`);
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
        console.log(`Perintah dimuat: ${command.data.name}`);
    }
};

loadCommands();

client.once(Events.ClientReady, () => {
    console.log(`Bot ${client.user.tag} siap!`);
    client.user.setActivity('siap untuk bermain!', { type: 'PLAYING' });
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    console.log(`Interaksi perintah diterima: ${interaction.commandName}`);

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`Command not found: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction, updateBotActivity); // Pass updateBotActivity sebagai parameter
        console.log(`Perintah dieksekusi: ${interaction.commandName}`);
    } catch (error) {
        console.error('Error executing command:', error);
        await interaction.reply({ content: 'Ada kesalahan saat mengeksekusi perintah ini!', ephemeral: true });
    }
});

// Daftarkan event handler untuk voice state change
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    console.log(`VoiceStateUpdate: ${oldState.channelId} -> ${newState.channelId}`);
    handleVoiceStateChange(oldState, newState);
});

// Error handling untuk login
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('Bot berhasil login!'))
    .catch(error => {
        console.error('Failed to login:', error);
    });
