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

// var genid = function(){
//   if(cluster.isMaster){
//     var gid;
//     client.get('generator', function (err, key) {
//       if(err) log.error('Can`t read from Redis store: %s', err);
//       else if (key) {
//         // key exist
//         log.info('key: %s', key);
//       } else {
//         // key not exist
//         log.info('key "generator" not found');
//         gid = Math.floor(Math.random() * config.workers.name.length)+1;
//         // log.info('Set random generator ID: %d', generator_ID);
//       };
//     });
//     return gid;
//   }
// }


// var checkRedisReadyState = function() {
//     return new Promise((resolve,reject) => {
//         redis.once('ready', () => {redis.removeAllListeners('error'); resolve()});
//         redis.once('error', e => reject(e));
//     });
// }

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
    setid: setid
};
// module.exports.client = client;
