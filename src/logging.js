const Sqlite3 = require("sqlite3").verbose();

// Returns an timestamp string, conforming to the sql timestamp format
function sqltime(){
  var pad = (n)=> {
    if(n < 10)
      return '0' + n;
    return n;
  }
  var date = new Date();
  return date.getUTCFullYear() +
  "-" + pad(date.getUTCMonth() + 1) + //january is 0 :thinking:
  "-" + pad(date.getUTCDate()) +
  " " + pad(date.getUTCHours()) +
  ":" + pad(date.getUTCMinutes()) +
  ":" + pad(date.getUTCSeconds()) +
  "." + date.getUTCMilliseconds();
}

// Returns a string for table creation
function sqltable( name, table ){
  var sql = "CREATE TABLE IF NOT EXISTS " + name;
  sql += "(id INTEGER PRIMARY KEY"
  for(var key in table ){
    sql += ", " + key + " " + table[key];
  }
  return sql + ")";
}

// Actions for voice activity
const Actions = {
  DISCONNECT: 0,
  CONNECT:    1,
  MOVED:      2,
  TIMEOUT:    3,
  MUTE:       4,
  UNMUTE:     5,
  DEAFEN:     6,
  UNDEAFEN:   7,
  display : (i)=>{
    return Object.keys(Actions)[i];
  }
}

class Logger {
  constructor(){
    this.database = null;
  }

  init( guildid ){
    var db = new Sqlite3.Database( "./data/" + guildid + ".db" );
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
        action : "INT",
        channelid : "INT",
        timestamp : "TEXT"
      }))
      db.run(sqltable("MessageActivity", {
        userid : "INT",
        channelid : "INT",
        timestamp : "TEXT"
      }))
    });
    this.database = db;
  }

  logMessageActivity( userid, channelid ){
    console.log({
      userid,
      channelid,
      timestamp: sqltime(),
    })
    if(this.database){
      this.database.run("INSERT INTO MessageActivity( userid, channelid, timestamp ) VALUES( ?, ?, ? )",
        [userid, channelid, sqltime()]);
    } else {
      console.log("Failed to log message activity. Database not initialized!");
    }
  }

  logVoiceActivity( userid, channelid, action ){
    console.log({
      userid,
      channelid,
      timestamp : sqltime(),
      action : Actions.display(action),
    })
    if(this.database){
      this.database.run("INSERT INTO VoiceActivity( userid, action, channelid, timestamp ) VALUES( ?, ?, ?, ? )",
        [userid, action, channelid, sqltime()])
    } else {
      console.log("Failed to log voice activity. Database not initialized!");
    }
  }

  logUser( userid, username ){

  }

  logChannel( channelid, channelname ){

  }
}

module.exports = {
  Actions : Actions,
  Logger : Logger
}
