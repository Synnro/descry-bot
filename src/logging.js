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

  /**
  * Logger.init
  * Creates or connects to database for guildid
  * @param {int} guildid
  */
  init( guildid ){
    var db = new Sqlite3.Database( "./data/" + guildid + ".db" );
    db.serialize(()=>{
      db.run(sqltable("Users", {
        userid : "INT",
        username : "TEXT"
      }))
      .run(sqltable("Channels", {
        channelid : "INT",
        channelname : "TEXT"
      }))
      .run(sqltable("VoiceActivity", {
        userid : "INT",
        action : "INT",
        channelid : "INT",
        timestamp : "TEXT"
      }))
      .run(sqltable("MessageActivity", {
        userid : "INT",
        channelid : "INT",
        timestamp : "TEXT"
      }), ()=>{
        this.database = db;
      })
    });
  }

  /**
  * Logger.logMessageActivity
  * Inserts new message activity record into table
  * @param {int} userid
  * @param {int} channelid
  */
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

  /**
  * Logger.logVoiceActivity
  * Inserts new voice activity record into table
  * @param {int} userid
  * @param {int} channelid
  * @param {int} action - flag for activity type, found in Actions table
  */
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

  /**
  * Logger.logUser
  * Inserts user into table if not existing
  * @param {int} userid
  * @param {string} username
  */
  logUser( userid, username ){
    if(this.database){
      this.database.get("SELECT * FROM Users WHERE userid = ?", [userid], (error, result)=>{
        if(error)
          console.log(error);
        if(!result){
          console.log("Logging new user: " + username );
          this.database.run("INSERT INTO Users( userid, username ) VALUES( ?, ? )",
            [userid, username])
        }
      })
    }
  }

  /**
  * Logger.logChannel
  * Inserts channel into table if not existing
  * @param {int} channelid
  * @param {string} channelname
  */
  logChannel( channelid, channelname ){
    if(this.database){
      this.database.get("SELECT * FROM Channels WHERE channelid = ?", [channelid], (error, result)=>{
        if(error)
          throw error;
        if(!result){
          console.log("Logging new channel: " + channelname );
          this.database.run("INSERT INTO Channels( channelid, channelname ) VALUES ( ?, ? )",
            [channelid, channelname])
        }
      })
    }
  }
}

module.exports = {
  Actions : Actions,
  Logger : Logger
}
