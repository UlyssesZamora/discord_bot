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
    const playerManager = client.playerManager;
    if (!voiceChannel) {
      return interaction.followUp("❌ You need to be in a voice channel!");
    }

    try {
      const queue = playerManager.getQueue(interaction.guildId);
      await interaction.followUp(`Logged queue`);
    } catch (error) {
      console.error("Error:", error);
      await interaction.followUp("❌ There was an error displaying the queue!");
    }
  },
};
