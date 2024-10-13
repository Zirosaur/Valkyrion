const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { PassThrough } = require('stream');
const https = require('https');
const fs = require('fs');

const player = createAudioPlayer();
let connection = null;
let stream = new PassThrough();
let currentIndex = 0;
let radioLinks = [];
let currentMessage = null;
let selectionMessage = null;

// Load radio links from JSON file
function loadRadioLinks() {
    try {
        const data = fs.readFileSync('radioLinks.json', 'utf8');
        radioLinks = JSON.parse(data).links;
    } catch (error) {
        console.error('Gagal memuat radioLinks.json:', error);
    }
}

loadRadioLinks();

const playRadio = (url, channel) => {
    https.get(url, (res) => {
        console.log(`Status code untuk ${url}: ${res.statusCode}`);
        if (res.statusCode === 200) {
            res.pipe(stream);
        } else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            console.log(`Mengalihkan ke: ${res.headers.location}`);
            playRadio(res.headers.location, channel);
        } else {
            channel.send(`Gagal terhubung ke ${radioLinks[currentIndex].name}. Mencoba saluran berikutnya...`);
            currentIndex = (currentIndex + 1) % radioLinks.length; // Coba saluran berikutnya
            playRadio(radioLinks[currentIndex].url, channel);
        }
    }).on('error', (err) => {
        console.error(`Error saat menghubungi radio: ${err.message}`);
        channel.send(`Terjadi kesalahan saat menghubungi ${radioLinks[currentIndex].name}. Mencoba saluran berikutnya...`);
        currentIndex = (currentIndex + 1) % radioLinks.length; // Coba saluran berikutnya
        playRadio(radioLinks[currentIndex].url, channel);
    });
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('Mengelola radio 24/7.')
        .addSubcommand(subcommand =>
            subcommand.setName('play').setDescription('Mulai memutar radio.'))
        .addSubcommand(subcommand =>
            subcommand.setName('stop').setDescription('Hentikan pemutaran radio.')),

    async execute(interaction, updateBotActivity) {
        await interaction.deferReply();

        const voiceChannel = interaction.member.voice.channel;
        const channel = interaction.channel;

        if (interaction.options.getSubcommand() === 'play') {
            if (!voiceChannel) {
                return await interaction.editReply('Bergabunglah dengan saluran suara terlebih dahulu!');
            }

            if (!connection) {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });

                connection.on('error', error => console.error('Koneksi suara error:', error));
                connection.on('stateChange', (oldState, newState) => {
                    if (newState.status === 'disconnected') {
                        console.log('Bot terputus dari saluran suara');
                        connection = null;
                    }
                });

                connection.subscribe(player);
            }

            stream = new PassThrough();
            const resource = createAudioResource(stream);
            player.play(resource);

            playRadio(radioLinks[currentIndex].url, channel);
            const startingMessage = await interaction.editReply('Memulai radio!');

            const options = radioLinks.map((link, index) => ({
                label: link.name,
                value: `${index}`,
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_radio')
                .setPlaceholder('Pilih saluran radio...')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            selectionMessage = await channel.send({ 
                content: '🎶 Selamat datang di radio-control! 🎶\n\nSilahkan pilih saluran radio favoritmu di bawah ini dan nikmati musik tanpa henti! 🌟', 
                components: [row] 
            });

            currentMessage = await channel.send(`Sekarang memutar: **${radioLinks[currentIndex].name}**`);
            await startingMessage.delete();

            updateBotActivity(interaction.client, `memutar ${radioLinks[currentIndex].name}`);

            const filter = i => i.customId === 'select_radio';
            const collector = channel.createMessageComponentCollector({ filter });

            collector.on('collect', async (i) => {
                const index = parseInt(i.values[0]);
                if (index !== currentIndex) {
                    currentIndex = index;

                    player.stop();
                    stream.end();
                    stream = new PassThrough();
                    const newResource = createAudioResource(stream);
                    player.play(newResource);

                    playRadio(radioLinks[currentIndex].url, channel);

                    await currentMessage.edit(`Sekarang memutar: **${radioLinks[currentIndex].name}**`);
                    updateBotActivity(interaction.client, `memutar ${radioLinks[currentIndex].name}`);
                }
                await i.deferUpdate();
            });

            collector.on('end', () => {
                console.log('Kolektor menu selesai');
            });

        } else if (interaction.options.getSubcommand() === 'stop') {
            if (connection) {
                player.stop();
                stream.end();
                connection.disconnect();
                connection = null;
                currentIndex = 0;

                if (selectionMessage) await selectionMessage.delete();
                if (currentMessage) await currentMessage.delete();

                const stopMessage = await interaction.editReply('Radio dihentikan.');
                setTimeout(async () => {
                    await stopMessage.delete(); // Menghapus pesan setelah 3 detik
                }, 3000);
            } else {
                await interaction.editReply('Radio tidak sedang diputar.');
            }
        }
    },
};
