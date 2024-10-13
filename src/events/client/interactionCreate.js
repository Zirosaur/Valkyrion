// src/event/client/interactionCreate.js
const { Events } = require('discord.js');

module.exports = (client, updateBotActivity) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isCommand()) return;

        console.log(`Interaksi perintah diterima: ${interaction.commandName}`);

        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`Command not found: ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction, updateBotActivity);
            console.log(`Perintah dieksekusi: ${interaction.commandName}`);
        } catch (error) {
            console.error('Error executing command:', error);
            await interaction.reply({ content: 'Ada kesalahan saat mengeksekusi perintah ini!', ephemeral: true });
        }
    });
};
