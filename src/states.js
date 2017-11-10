// removes any StateBased functionality from the object
function clean( obj ){
  for( var fn in obj.state )
    delete obj[fn];
  delete obj.state;
}

// cleans, then adds the state logic to the object
function mutate( obj, state ){
  clean( obj );
  for( var fn in state )
    obj[fn] = state[fn];
  obj.state = state;
}

class StateBased {
  mutate( state ){
    if( state )
      mutate( this, state );
    else
      clean( this );
    this.onStateEnter();
  }
  onStateEnter(){
  }
}

module.exports = {
  StateBased : StateBased
}
