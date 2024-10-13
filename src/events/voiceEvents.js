const { VoiceConnectionStatus } = require('@discordjs/voice');

function handleVoiceStateChange(oldState, newState) {
    const connection = newState.connection;

    if (connection) {
        if (newState.status === VoiceConnectionStatus.Disconnected) {
            // Jika ada pengguna yang tersisa, jangan disconnect
            if (newState.memberCount > 0) {
                console.log('Ada anggota di saluran, bot tetap terhubung.');
            } else {
                console.log('Saluran kosong, bot tetap terhubung.');
                // Coba sambung kembali ke saluran
                connection.connect();
            }
        }
    }
}

module.exports = { handleVoiceStateChange };
