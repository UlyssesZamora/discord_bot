const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js')
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('The song you want to play (URL or search terms)')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        console.log(PermissionsBitField.flags)

        const voiceChannel = interaction.member.voice.channel;
        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
            return interaction.followUp('❌ I need permissions to join and speak in your voice channel!');
        }

        const songQuery = interaction.options.getString('song')
        try {
            // Get existing connection
            let connection = getVoiceConnection(interaction.guildId);

            // If no connection exists or the connection is in a different channel, create a new one
            if (!connection || connection.joinConfig.channelId !== voiceChannel.id) {
                // Destroy the old connection if it exists
                if (connection) {
                    connection.destroy();
                }

                // Create new connection
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: false
                });

                // Store the connection in the client's voice manager
                client.voiceManager.connections.set(interaction.guildId, connection);
            }

            const embed = new EmbedBuilder()
                .setTitle('🎵 Now Playing')
                .setDescription(`**${songQuery}**`)
                .setColor(0x18e1ee)
                .setTimestamp(Date.now())
                .addFields([
                    {
                        name: 'Requested by',
                        value: interaction.user.username,
                        inline: true
                    },
                ])

            await interaction.followUp({
                embeds: [embed]
            })
        } catch (error) {
            console.error('Error details:', error)
            await interaction.followUp('❌ There was an error playing this track! Make sure the URL is valid.')
        }
    }
}