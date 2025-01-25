// src/commands/play.js
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption((option) =>
      option
        .setName("song")
        .setDescription("The song you want to play (URL or search terms)")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.followUp("❌ You need to be in a voice channel!");
    }

    try {
      const query = interaction.options.getString("song");
      const playerManager = client.playerManager;

      // Get song info
      const songInfo = await playerManager.getSongInfo(query);
      const song = {
        ...songInfo,
        requestedBy: interaction.user.tag,
      };

      // Check if something is already playing
      if (playerManager.isPlaying(interaction.guildId)) {
        await playerManager.addToQueue(interaction.guildId, song);
        return interaction.followUp(`📝 Added to queue: ${song.title}`);
      }

      // If nothing is playing, start playing this song
      await playerManager.play(interaction, voiceChannel, song);
      await interaction.followUp(`🎵 Now playing: ${song.title}`);
    } catch (error) {
      console.error("Error:", error);
      await interaction.followUp("❌ There was an error playing this track!");
    }
  },
};
