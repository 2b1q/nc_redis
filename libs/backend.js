var redis = require('redis'),
    cluster = require('cluster'),
    log = require('./log')(module),
    config = require('../config/config');

var client = redis.createClient(
  config.backend.redis.port,
  config.backend.redis.host
); //creates a new client


client.on('connect', function() {
      log.info('[cluster] connected to Redis');
});

client.on('error', function (err) {
  log.error('Ошибка подключения к Redis "%s"', err);
  log.info('попробуйте запустить Redis:\n"docker start redis" если Redis ранее запускался в docker`e\nили\n"docker run -p 6379:6379 --name redis -d redis" для скачивания образа Redis и запуска контейнера Redis в docker`e');
  if(client) client.quit(); // close redis connection
  process.exit(0);
});

// getkey Promise
function getkey(keyid){
  console.log('\nGET key: "%s"\n',keyid);
  return new Promise(function(resolve, reject){
    client.hgetall(keyid, function(err, object) {
      if(err) reject(err);
      if(object) {
        console.log(object);
        // 50/50 FAIL and store KEYID if FAIL
        Math.random() > .5
                    ? resolve(keyid)
                    : reject('Read hashes from REDIS FAIL.\nExec IIFE and RESAVE hashes to Hospital STORE\n'
                    +(function(hospital_object){
                      client.hmset('hospital_'+keyid, hospital_object); // Storing hospital_object to hospital
                      return 'Storing hospital_object to hospital'})(object))
        // resolve(keyid); // pass keyid to rmkey(keyid)
      }
    });
  });
}

// rmkey Promise
function rmkey(keyid){
  console.log(config.color.cyan+'\nREMOVE key '+config.color.green+'%s'+config.color.cyan+' from Redis store\n', keyid);
  return new Promise(function(resolve, reject){
    client.del(keyid, function(err, reply) {
      // log.warn(config.color.green+'\nRead and Remove KEY '+config.color.yellow+'%s'+config.color.cyan+' Replay: %s',keyid,reply);
      if(err) reject('remove key from redis FAIL. Error: %s', err)
      if(reply) resolve(log.warn(config.color.green+'\nRead and Remove KEY '+config.color.yellow+'%s'+config.color.cyan+' Replay: %s',keyid,reply))
    });
  });
}

// get msg with Promise
var get_msg = function(keyid){
  new Promise(function(resolve, reject){
    client.exists(keyid, function(err, reply) {
      if( err ) reject(err);
      if( reply === 1 ) resolve(keyid);
      else reject('KEY '+keyid+' not exists in Redis store');
    });
  })
  .then(getkey)
  .then(rmkey)
  .catch(error => log.error(error))

  // client.exists(keyid, function(err, reply) {
  //   if(reply === 1) {
  //     //KEY exists. GET hashes object
  //     client.hgetall(keyid, function(err, object) {
  //       console.log(object);
  //       rm_msg(keyid);
  //     });
  //   } else log.warn('KEY %s already readed from Redis store', keyid);
  // });
}

// remove msg
var rm_msg = function(keyid){
  client.del(keyid, function(err, reply) {
    log.warn(config.color.green+'\nRead and Remove KEY '+config.color.yellow+'%s'+config.color.cyan+' Replay: %s',keyid,reply);
  });
}

var getall_keys = function(){
  client.keys('*', function (err, keys) {
    if(err) return log.error(err);
    for(var i = 0, len = keys.length; i < len; i++) {
      if(keys[i].length === 32) { // get (not Hostpital_ and Not generator) keys
        get_msg(keys[i]);
      }
    }
  });
}

// get generator_ID
var getid = function(){
  client.get('generator', function (err, key) {
    if(err) log.error('Can`t read from Redis store: %s', err);
    else if (key) {
      // key exist
      log.info('GET generator_ID from Redis: "%s"', key);
      config.generator.redis_id = key; // update generator ID from runtime (from redis)
    } else {
      // key not exist
      log.info('key "generator" not found');
      log.info('Set random generator ID');
      config.generator.random_id = Math.floor(Math.random() * config.workers.name.length)+1;
    };
  });
}

//set generator_ID
var setid = function(genid){
  client.set('generator', genid, function (err, repl) {
    if(err) {
      log.error('Can`t write to Redis %s', err);
      client.quit();
    } else log.info('write genid "%d" sucsess. Replay %s',genid, repl);
  });
}

module.exports = {
    client: client,
    getid:  getid,
    setid: setid,
    get_msg: get_msg,
    get_keys: getall_keys
};
