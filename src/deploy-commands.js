const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
    {
        name: 'radio',
        description: 'Mengelola radio 24/7.',
        options: [
            {
                type: 1, // Subcommand type
                name: 'play',
                description: 'Mulai memutar radio.'
            },
            {
                type: 1, // Subcommand type
                name: 'stop',
                description: 'Hentikan pemutaran radio.'
            }
        ]
    },
];

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Memulai pengunduhan slash commands...');

        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
            body: commands,
        });

        console.log('Slash commands berhasil didaftarkan!');
    } catch (error) {
        console.error(error);
    }
})();
