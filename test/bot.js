const fs = require('fs');
const path = require('path'); // Impor path
const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Memuat variabel lingkungan dari .env di root
const { handleVoiceStateChange } = require('./events/voiceEvents'); // Pastikan ini mengarah ke file yang benar
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
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
    }
};

loadCommands();

client.once(Events.ClientReady, () => {
    console.log(`Bot ${client.user.tag} siap!`);
    client.user.setActivity('siap untuk bermain!', { type: 'PLAYING' });
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`Command not found: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction, updateBotActivity); // Pass updateBotActivity sebagai parameter
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

// Cek apakah token valid
if (!process.env.DISCORD_TOKEN) {
    console.error('DISCORD_TOKEN tidak ditemukan. Pastikan .env sudah benar.');
    process.exit(1);
}

// Error handling untuk login
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('Bot berhasil login!'))
    .catch(error => {
        console.error('Failed to login:', error);
    });
