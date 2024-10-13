// src/event/client/ready.js
module.exports = (client) => {
    console.log(`Bot ${client.user.tag} siap!`);
    client.user.setActivity('siap untuk bermain!', { type: 'PLAYING' });
};
