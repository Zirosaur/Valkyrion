// src/event/guild/voiceStateUpdate.js
module.exports = (handleVoiceStateChange) => {
    return (oldState, newState) => {
        console.log(`VoiceStateUpdate: ${oldState.channelId} -> ${newState.channelId}`);
        handleVoiceStateChange(oldState, newState);
    };
};
