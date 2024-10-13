const updateBotActivity = (client, activity) => {
    if (client.user) {
        console.log(`Mengupdate aktivitas bot menjadi: ${activity}`);
        client.user.setActivity(activity, { type: 'LISTENING' }); // Hilangkan .catch
    }
};

module.exports = { updateBotActivity };
