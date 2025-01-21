require('dotenv').config();
const { token } = process.env;
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
client.commandArray = [];

client.voiceManager = {
    connections: new Map()
};

client.on('voiceStateUpdate', (oldState, newState) => {
    // If the bot was disconnected
    if (oldState.member.id === client.user.id && !newState.channel) {
        const connection = getVoiceConnection(oldState.guild.id);
        if (connection) {
            connection.destroy();
            client.voiceManager.connections.delete(oldState.guild.id);
        }
    }
});

const functionFolders = fs.readdirSync('./src/functions');

for (const folder of functionFolders) {
    const functionFiles = fs.readdirSync(`./src/functions/${folder}`).filter(file => file.endsWith('.js'));

    for (const file of functionFiles) {
        require(`./functions/${folder}/${file}`)(client)
    }

}

client.handleEvents();
client.handleCommands();
client.login(token);