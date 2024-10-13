const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

const joinChannel = (interaction) => {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
        throw new Error('Kamu harus berada di channel suara!');
    }

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    return connection;
};

const handleDisconnect = (connection) => {
    connection.on(VoiceConnectionStatus.Disconnected, () => {
        console.log('Disconnected from voice channel.');
        connection.destroy();
    });
};

module.exports = {
    joinChannel,
    handleDisconnect,
};
