// src/commands/tools/play.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Look at song queue"),

  async execute(interaction, client) {
    await interaction.deferReply();

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.followUp("❌ You need to be in a voice channel!");
    }

    try {
      const queue = client.playerManager.getQueue(interaction.guildId);

      if (!queue || !queue.songs || queue.songs.length === 0) {
        return interaction.followUp("❌ There are no songs in the queue!");
      }

      const songsPerPage = 5;
      const page = 0; // Start with first page
      const maxPage = Math.ceil(queue.songs.length / songsPerPage);

      const startIndex = page * songsPerPage;
      const endIndex = Math.min(startIndex + songsPerPage, queue.songs.length);

      let description = queue.songs
        .slice(startIndex, endIndex)
        .map((song, index) => `${startIndex + index + 1}. **${song.title}**`)
        .join("\n");

      description += `\n\nPage ${page + 1}/${maxPage}`;

      const embed = new EmbedBuilder()
        .setTitle("🎵 Song Queue")
        .setDescription(description)
        .setColor(0x18e1ee);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("previous")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page >= maxPage - 1)
      );

      await interaction.followUp({
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error("Error:", error);
      await interaction.followUp("❌ There was an error displaying the queue!");
    }
  },
};
