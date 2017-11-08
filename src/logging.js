const Sqlite3 = require("sqlite3").verbose();

const Actions = {
  CONNECT: 0,
  DISCONNECT: 1,
  CHANGEROOM: 2,
  MUTE: 3,
  UNMUTE: 4,
  DEAFEN: 5,
  UNDEAFEN: 6,
  display : (i)=>{
    return Object.keys(Actions)[i];
  }
}

// jesus christ...
function seconds(){
  return Date.now()/1000;
}

function sqltable( name, table ){
  var sql = "CREATE TABLE IF NOT EXISTS " + name;
  sql += "(id INTEGER PRIMARY KEY"
  for(var key in table ){
    sql += ", " + key + " " + table[key];
  }
  return sql + ")";
}

function Logger(){
  this.database = null;
  this.init = (path)=>{
    var db = new Sqlite3.Database(path);
    db.serialize(()=>{
      db.run(sqltable("Users", {
        userid : "INT",
        username : "TEXT"
      }))
      db.run(sqltable("Channels", {
        channelid : "INT",
        channelname : "TEXT"
      }))
      db.run(sqltable("VoiceActivity", {
        userid : "INT",
        channelid : "INT",
        timestamp : "INT",
        action : "INT"
      }))
      db.run(sqltable("MessageActivity", {
        userid : "INT",
        channelid : "INT",
        timestamp : "INT"
      }))
    });
    this.database = db;
  }
  this.logUser = (userid, username)=>{
    console.log({
      user : userid,
      name : username
    })
  }
  this.logMessageActivity = (userid, channelid)=>{
    console.log({
      user : userid,
      channel : channelid,
      timestamp : seconds()
    })
    this.database.run("INSERT INTO MessageActivity(userid, channelid, timestamp) VALUES(?, ?, ?)",
      [userid, channelid, seconds()]);
  }
  this.logVoiceActivity = (userid, channelid, action)=>{
    console.log({
      user : userid,
      channel : channelid,
      timestamp : seconds(),
      action : Actions.display(action)
    })
    this.database.run("INSERT INTO VoiceActivity(userid, channelid, timestamp, action ) VALUES(?, ?, ?, ?)",
      [userid, channelid, seconds(), action])
  }
}

module.exports = {
  Actions : Actions,
  Logger : Logger
}
