const Sqlite3 = require("sqlite3").verbose();
const States = require("./states.js");

function warn( message ){
  return ()=>{ console.log( message ) };
}

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
function sqltable( name, table, constraints ){
  var sql = "CREATE TABLE IF NOT EXISTS " + name;
  sql += "(id INTEGER PRIMARY KEY"
  for(var key in table ){
    sql += ", " + key + " " + table[key];
  }
  for(var key in constraints ){
    sql += ", CONSTRAINT " + key + "_unique UNIQUE(" + key + ")"
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

class Logger extends States.StateBased {
  constructor(){
    super();
    this.database = null;
    this.mutate( LoggerDatabaseClosedState );
  }
  init(){}
  logMessageActivity(){}
  logVoiceActivity(){}
  logChannel(){}
  logUser(){}
}

const LoggerDatabaseClosedState = {
  onStateEnter : function(){
    console.log( "Database closed or not yet open..." )
  },
  init : function( guildid ){
    var db = new Sqlite3.Database( "./data/" + guildid + ".db" );
    db.serialize(()=>{
      db.run(sqltable("Users", {
        userid : "INT",
        username : "TEXT"
      },{
        userid : "UNIQUE"
      }))
      .run(sqltable("Channels", {
        channelid : "INT",
        channelname : "TEXT"
      }, {
        channelid : "UNIQUE"
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
        this.mutate( LoggerDatabaseOpenState );
      })
    });
  },
  logMessageActivity : warn( "Logger not connected to database..." ),
  logVoiceActivity : warn( "Logger not connected to database..." ),
  logChannel : warn( "Logger not connected to database..." ),
  logUser : warn( "Logger not connected to database..." )
}

const LoggerDatabaseOpenState = {
  onStateEnter : function(){
    console.log( "Datababase Opened!" );
  },
  init : warn( "Logger already connected to database..." ),
  logMessageActivity : function( userid, channelid ){
    this.database.run("INSERT INTO MessageActivity( userid, channelid, timestamp ) VALUES( ?, ?, ? )",
      [userid, channelid, sqltime()]);
  },
  logVoiceActivity : function( userid, channelid, action ){
    this.database.run("INSERT INTO VoiceActivity( userid, action, channelid, timestamp ) VALUES( ?, ?, ?, ? )",
      [userid, action, channelid, sqltime()]);
  },
  logChannel : function( channelid, channelname ){
    this.database.run("INSERT INTO Channels( channelid, channelname ) VALUES ( ?, ? )",
      [channelid, channelname],
      (err)=>{});
  },
  logUser : function( userid, username ){
    this.database.run("INSERT INTO Users( userid, username ) VALUES( ?, ? )",
      [userid, username],
      (err)=>{});
  }
}

module.exports = {
  Actions : Actions,
  Logger : Logger
}
