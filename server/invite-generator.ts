import { PermissionsBitField } from 'discord.js';

// Generate invite link with comprehensive permissions
export function generateBotInviteLink(clientId: string): string {
  const permissions = new PermissionsBitField([
    // Administrator permissions
    PermissionsBitField.Flags.Administrator,
    
    // Channel permissions
    PermissionsBitField.Flags.ViewChannels,
    PermissionsBitField.Flags.ManageChannels,
    PermissionsBitField.Flags.ManageWebhooks,
    
    // Message permissions
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.SendMessagesInThreads,
    PermissionsBitField.Flags.EmbedLinks,
    PermissionsBitField.Flags.ReadMessageHistory,
    PermissionsBitField.Flags.MentionEveryone,
    PermissionsBitField.Flags.UseExternalEmojis,
    PermissionsBitField.Flags.UseExternalStickers,
    
    // Voice permissions
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.UseVAD,
    PermissionsBitField.Flags.PrioritySpeaker,
    PermissionsBitField.Flags.RequestToSpeak,
    
    // Application command permissions
    PermissionsBitField.Flags.UseApplicationCommands,
  ]);

  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions.bitfield}&scope=bot%20applications.commands`;
  
  return inviteUrl;
}

// Get permission list for display
export function getPermissionsList(): string[] {
  return [
    'Administrator',
    'Manage Webhooks',
    'View Channels',
    'Send Messages',
    'Send Messages in Threads',
    'Embed Links',
    'Read Message History',
    'Mention @everyone, @here, and All Roles',
    'Use External Emoji',
    'Use External Stickers',
    'Use Application Commands',
    'Connect',
    'Speak',
    'Use Voice Activity',
    'Priority Speaker',
    'Request to Speak'
  ];
}