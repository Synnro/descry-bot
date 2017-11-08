const FileSystem = require("fs");
const Discord = require("discord.js");
const Logging = require("./src/logging.js");

const bot = new Discord.Client();
const logger = new Logging.Logger();

function isGuild(id){
  return false;
}

bot.on("message", (message)=>{
  if(!isGuild(message.guild.id))
    return;
  return logger.logMessageActivity(message.author.id, message.channel.id);
});

bot.on("voiceStateUpdate", (previous, current)=>{
  if(!isGuild(previous.guild.id))
    return;

  var user = previous.user;

  // connect
  if(!previous.voiceChannelID)
    return logger.logVoiceActivity(user.id, current.voiceChannelID, Logging.Actions.CONNECT);

  // disconnect
  if(!current.voiceChannelID)
    return logger.logVoiceActivity(user.id, previous.voiceChannelID, Logging.Actions.DISCONNECT);

  // change room
  if(previous.voiceChannelID != current.voiceChannelID)
    return logger.logVoiceActivity(user.id, current.voiceChannelID, Logging.Actions.CHANGEROOM);

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
  var conf = JSON.parse(data);
  bot.login(conf.token);
  logger.init("./data/" + conf.guild + ".db");
  isGuild = (id)=>{
    return (id === conf.guild);
  }
});
