// src/managers/PlayerManager.js
const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const youtubeDl = require("youtube-dl-exec");

class PlayerManager {
  /**
   * Initialize the PlayerManager with empty maps for queues, players and connections
   */
  constructor() {
    this.queues = new Map();
    this.players = new Map();
    this.connections = new Map();
  }

  /**
   * Join a voice channel and create a connection
   * @param {Interaction} interaction - The interaction that triggered this
   * @param {VoiceChannel} voiceChannel - The voice channel to join
   * @returns {VoiceConnection} The created voice connection
   */
  async joinVoiceChannel(interaction, voiceChannel) {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });
    this.connections.set(interaction.guildId, connection);
    return connection;
  }

  /**
   * Get the queue for a guild, creating it if it doesn't exist
   * @param {string} guildId - The ID of the guild
   * @returns {Array} The queue for the guild
   */
  getQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, []);
    }
    return this.queues.get(guildId);
  }

  /**
   * Get the audio player for a guild, creating it if it doesn't exist
   * @param {string} guildId - The ID of the guild
   * @returns {AudioPlayer} The audio player for the guild
   */
  getPlayer(guildId) {
    if (!this.players.has(guildId)) {
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play,
        },
      });
      this.players.set(guildId, player);
    }
    return this.players.get(guildId);
  }

  /**
   * Get song information from a URL or search query
   * @param {string} query - The URL or search terms
   * @returns {Object} Song information including title, URL, thumbnail and duration
   */
  async getSongInfo(query) {
    const songInfo = await youtubeDl(query, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      extractAudio: true,
      format: "bestaudio",
    });

    return {
      title: songInfo.title,
      url: songInfo.url,
      thumbnail: songInfo.thumbnail,
      duration: songInfo.duration,
    };
  }

  /**
   * Add a song to a guild's queue
   * @param {string} guildId - The ID of the guild
   * @param {Object} song - The song to add to the queue
   */
  async addToQueue(guildId, song) {
    const queue = this.getQueue(guildId);
    queue.push(song);
  }

  /**
   * Check if audio is currently playing in a guild
   * @param {string} guildId - The ID of the guild
   * @returns {boolean} Whether audio is playing
   */
  isPlaying(guildId) {
    const player = this.players.get(guildId);
    return player && player.state.status !== AudioPlayerStatus.Idle;
  }

  /**
   * Play a song in a voice channel
   * @param {Interaction} interaction - The interaction that triggered this
   * @param {VoiceChannel} voiceChannel - The voice channel to play in
   * @param {Object} song - The song to play
   * @returns {boolean} Whether the play was successful
   */
  async play(interaction, voiceChannel, song) {
    const guildId = interaction.guildId;

    try {
      // Join voice channel if not already connected
      if (!this.connections.has(guildId)) {
        const connection = await this.joinVoiceChannel(
          interaction,
          voiceChannel
        );
        const player = this.getPlayer(guildId);
        connection.subscribe(player);
      }

      const player = this.getPlayer(guildId);

      // Create and play resource
      const resource = createAudioResource(song.url);
      player.play(resource);

      // Set up event handlers if they haven't been set
      if (!player._eventsCount) {
        this.setupPlayerEvents(player, interaction, voiceChannel);
      }

      return true;
    } catch (error) {
      console.error("Error in play function:", error);
      throw error;
    }
  }

  /**
   * Set up event handlers for an audio player
   * @param {AudioPlayer} player - The player to set up events for
   * @param {Interaction} interaction - The interaction that triggered this
   * @param {VoiceChannel} voiceChannel - The voice channel being used
   */
  setupPlayerEvents(player, interaction, voiceChannel) {
    const guildId = interaction.guildId;

    player.on(AudioPlayerStatus.Idle, () => {
      const queue = this.getQueue(guildId);
      if (queue && queue.length > 0) {
        const nextSong = queue.shift();
        this.play(interaction, voiceChannel, nextSong);
      } else {
        this.players.delete(guildId);
        this.connections.get(guildId)?.disconnect();
        this.connections.delete(guildId);
      }
    });

    player.on("error", (error) => {
      console.error("Player error:", error);
      const queue = this.getQueue(guildId);
      if (queue && queue.length > 0) {
        const nextSong = queue.shift();
        this.play(interaction, voiceChannel, nextSong);
      }
    });
  }

  /**
   * Clean up all resources for a guild
   * @param {string} guildId - The ID of the guild to clean up
   */
  destroy(guildId) {
    this.players.delete(guildId);
    this.queues.delete(guildId);
    if (this.connections.has(guildId)) {
      this.connections.get(guildId).disconnect();
      this.connections.delete(guildId);
    }
  }
}

module.exports = PlayerManager;
