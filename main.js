const FileSystem = require("fs");
const Discord = require("discord.js");
const Logging = require("./src/logging.js");


const logger = new Logging.Logger();
const bot = new Discord.Client();

var conf;

/**
* Message Event
* Event handler for receiving messages
* Passes information to the logger
* @param {Message} message
*/
bot.on("message", (message)=>{
  if(conf.guild != message.guild.id)
    return;

  var user = message.author;
  logger.logUser(user.id, user.username);
  logger.logChannel(message.channel.id, message.channel.name);

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
  if(conf.guild != previous.guild.id)
    return;

  var user = previous.user;
  logger.logUser(user.id, user.username);
  if(previous.voiceChannel)
    logger.logChannel(previous.voiceChannel.id, previous.voiceChannel.name);
  if(current.voiceChannel)
    logger.logChannel(current.voiceChannel.id, current.voiceChannel.name);

  // connect
  if(!previous.voiceChannelID)
    return logger.logVoiceActivity(user.id, current.voiceChannelID, Logging.Actions.CONNECT);

  // disconnect
  if(!current.voiceChannelID)
    return logger.logVoiceActivity(user.id, previous.voiceChannelID, Logging.Actions.DISCONNECT);

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
});
