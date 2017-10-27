var cluster = require('cluster'),
    path = require('path'),
    log = require('./libs/log')(module),
    config = require('./config/config'),
    backend = require('./libs/backend'),
    generator = require('./models/msg_generator');

var client = backend.client; // init redis store client
var msg_cnt = 0; // msg counter
var generator_ID;

// start worker
function startWorker() {
  /*  read from redis who is MSG generator
      if no records => random worker [worker.id] is MSG generator
      if record exist (check )who is generator
      else fork() EventHanler workers
  */
  var worker = cluster.fork();
  if( generator_ID == worker.id ) log.warn('\n[worker "%s"] => MSG generator (pid %d) started', config.workers.name[worker.id-1], worker.process.pid);
  else log.info('\n[worker "%s"] => Event Hanler (pid %d) started', config.workers.name[worker.id-1], worker.process.pid);
}

// master cluster process
if(cluster.isMaster){
  log.info('[Master] (pid %d) started',process.pid);
  // get generator_ID from Redis store
  backend.getid();
  // var generator_ID;

  setInterval(() => {
    if(config.generator.redis_id !== undefined) generator_ID = config.generator.redis_id;
    if(config.generator.random_id !== undefined) generator_ID = config.generator.random_id;
    generator_ID = parseInt(generator_ID);
    log.warn('generator_ID: %s',generator_ID)
    // write generator_ID to Redis store
    backend.setid(generator_ID);
  }, 1000);

/*
  1. read from redis who is generator
  2. if no record set rand generator worker1-10
  3. if exist read worker ID/name/
  4. start workers (compare worker.id and ID)
  5. if worker.id == ID this.worker IS generator

*/
  config.workers.name.forEach(function(){
    startWorker();
  });

  cluster.on('online', (worker) => {
    console.log('worker %s responded after it was forked', worker.id);
  });

  // generate msg (Redis hset)
  setInterval(() => {
    for(var id in cluster.workers) {
      if( cluster.workers[id].id === generator_ID ) {
        var msg = generator.msg();
        var worker_name = config.workers.name[cluster.workers[id].id-1];
        var worker_id = cluster.workers[id].id;
        let timestamp = () => new Date().getDate() + '.'
                          + new Date().getMonth() + '.'
                          + new Date().getFullYear() + '_'
                          + new Date().getHours() + ':'
                          + new Date().getMinutes() + ':'
                          + new Date().getMilliseconds(); // timestamp
        log.warn('[worker "%s"] (MSG generator)\n %s', worker_name, msg);
        log.info('timestamp: "%s"', timestamp());
        // hashes (objects) in Redis. For that you can use hmset()
        // msg_cnt = hash KEY
        // before write hash check IS exists msg_cnt
        // Hashes KEY ID = MD5 HASH from (msg_cnt)
        ++msg_cnt;
        var id =  msg_cnt.toString();
        var hashid = generator.hashid(id);
        log.info('hashid: %s',hashid);
        client.hmset(hashid, {
          'msg': msg,
          'worker_name': worker_name,
          'worker_id': worker_id,
          'timestamp': timestamp()
        });
        cluster.workers[generator_ID].send({generator_ID: generator_ID}); // send MSG to workers WHO is generator (IPC channel)
      }
    }
  }, config.generator.timeout);


  cluster.on('disconnect', function(worker){
    log.error('[worker "%s"] (pid %d) disconnected.', config.workers.name[worker.id-1], worker.process.pid);
  });
  cluster.on('exit', function(worker, code, signal){
    log.error('[worker "%s"] exit with code %d  (%s).', config.workers.name[worker.id-1], code, signal);
    startWorker();
  });
} else {
  // read generator_ID from Redis
  backend.getid();

  setInterval(() => {
    generator_ID = parseInt(config.generator.redis_id);
    // if worker IS NOT generator
    if( generator_ID !== cluster.worker.id ){
      log.info('[worker %d] read generator_ID from Redis => %d', cluster.worker.id,generator_ID)
      console.log('generator_ID :::::::' +generator_ID);
    }
  }, config.eventhandler.poll_period);

  // Receive messages from the master process. (IPC channel)
  process.on('message', function(msg) {
    console.log('Worker ' + process.pid + ' received message from master over IPC channel.', msg);
  });


}



process.on('uncaughtException', function (err) {
    log.error((new Date).toUTCString() + ' uncaughtException:', err.message);
    log.error(err.stack);
    process.exit(1);
});
