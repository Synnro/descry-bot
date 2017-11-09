const FileSystem = require("fs");
const Discord = require("discord.js");
const Logging = require("./src/logging.js");

const logger = new Logging.Logger();
const bot = new Discord.Client();

var conf;

function isGuild(id){
  return false;
}

/**
* Message Event
* Event handler for receiving messages
* Passes information to the logger
* @param {Message} message
*/
bot.on("message", (message)=>{
  if(!isGuild(message.guild.id))
    return;

  var user = message.author;
  // TODO: move this to user join event for performance
  logger.logUser(user.id, user.username);
  logger.logChannel(message.channel);

  return logger.logMessageActivity(user.id, message.channel.id);
});

/**
* VoiceStateUpdate Event
* Event handler for voice state updating
* Passes information to the logger
* @param {GuildMember} previous - previous state
* @param {GuildMember} current  - current state
*/
bot.on("voiceStateUpdate", (previous, current)=>{
  if(!isGuild(previous.guild.id))
    return;

  var user = previous.user;
  // TODO: move this to user join event for performance
  logger.logUser(user.id, user.username);

  // connect
  if(!previous.voiceChannelID){
    logger.logChannel(current.voiceChannel.id, current.voiceChannel.name);
    return logger.logVoiceActivity(user.id, current.voiceChannelID, Logging.Actions.CONNECT);
  }

  // disconnect
  if(!current.voiceChannelID){
    logger.logChannel(previous.voiceChannel.id, previous.voiceChannel.name);
    return logger.logVoiceActivity(user.id, previous.voiceChannelID, Logging.Actions.DISCONNECT);
  }

  // if move between rooms, log each
  logger.logChannel(previous.voiceChannel.id, previous.voiceChannel.name);
  logger.logChannel(current.voiceChannel.id, current.voiceChannel.name);

  // change room
  if(previous.voiceChannelID != current.voiceChannelID)
    return logger.logVoiceActivity(user.id, current.voiceChannelID, Logging.Actions.MOVED);

  // deafen
  if(!previous.selfDeaf && current.selfDeaf)
    return logger.logVoiceActivity(user.id, current.voiceChannelID, Logging.Actions.DEAFEN);

  // undeafen
  if(previous.selfDeaf && !current.selfDeaf)
    return logger.logVoiceActivity(user.id, current.voiceChannelID, Logging.Actions.UNDEAFEN);

  // mute
  if(!previous.selfMute && current.selfMute)
    return logger.logVoiceActivity(user.id, current.voiceChannelID, Logging.Actions.MUTE);

  // unmute
  if(previous.selfMute && !current.selfMute)
    return logger.logVoiceActivity(user.id, current.voiceChannelID, Logging.Actions.UNMUTE);
});


FileSystem.readFile("./conf.json", "utf8", (error, data)=>{
  if(error)
    throw error;
  conf = JSON.parse(data);
  bot.login(conf.token);
  logger.init(conf.guild);
  isGuild = (id)=>{
    return (id === conf.guild);
  }
});
