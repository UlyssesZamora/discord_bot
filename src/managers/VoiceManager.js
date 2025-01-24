class VoiceManager {
  constructor() {
    this.connections = new Map();
  }

  getConnection(guildId) {
    return this.connections.get(guildId);
  }

  setConnection(guildId, connection) {
    this.connections.set(guildId, connection);
  }

  removeConnection(guildId) {
    this.connections.delete(guildId);
  }
}

module.exports = VoiceManager;
