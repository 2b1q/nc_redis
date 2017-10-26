var cluster = require('cluster'),
    path = require('path'),
    log = require('./libs/log')(module),
    config = require('./config/config'),
    backend = require('./libs/backend'),
    generator = require('./models/msg_generator');

var client = backend.redis; // redis client (add callback iff ERR log and exit)
client.on("error", function (err) {
  log.error('Ошибка подключения к Redis "%s"', err);
  log.info('попробуйте запустить Redis:\n"docker start redis" если Redis ранее запускался в docker`e\nили\n"docker run -p 6379:6379 --name redis -d redis" для скачивания образа Redis и запуска контейнера Redis в docker`e')
  process.exit(0);
});
var msg_cnt = 0; // msg counter

/*
// Попробуем записать и прочитать
client.set('myKey', 'Hello Redis', function (err, repl) {
    if (err) {
           // Оо что то случилось при записи
           console.log('Что то случилось при записи: ' + err);
           client.quit();
    } else {
           // Прочтем записанное
           client.get('myKey', function (err, repl) {
                   //Закрываем соединение, так как нам оно больше не нужно
                   client.quit();
                   if (err) {
                           console.log('Что то случилось при чтении: ' + err);
                   } else if (repl) {
                   // Ключ найден
                           console.log('Ключ: ' + repl);
               } else {
                   // Ключ ненайден
                   console.log('Ключ ненайден.')

           };
           });
    };
});
1) String — это самый простой тип ключей, представляет собой структуру Ключ -> Значение. Несмотря на то что он называется String, сюда можно записывать строковые, числовые и битовые значения.
2) List — этот тип данных представляет собой аналог массивов.
3) Hashes — это специальный тип данных, представляющий собой структуру Поле -> Значение. В качестве типов полей могут быть строки и числа.
4) Set / Sortedset — Последние два типа. представляют собой множества. Причем sortedset является отсортированным множеством. Значения сортируются по весу, вес нужно задавать самостоятельно.
*/






// var app = express();

function startWorker() {
  /*  read from redis who is MSG generator
      if no records => random worker [worker.id] is MSG generator
      if record exist (check )who is generator
      else fork() EventHanler workers
  */
  var worker = cluster.fork();
  if( generator_ID == worker.id ) log.info('[worker "%s"] => MSG generator (pid %d) started', config.workers.name[worker.id-1], worker.process.pid);
  else log.info('[worker "%s"] => Event Hanler (pid %d) started', config.workers.name[worker.id-1], worker.process.pid);

}

if(cluster.isMaster){
  console.log('[Master] (pid %d) started',process.pid);
  var generator_ID = Math.floor(Math.random() * config.workers.name.length)+1;
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
        log.info('[worker "%s"] (MSG generator)\n %s', worker_name, msg);
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

  // notify master about the request
  // Worker processes have a http server.
  // process.on('message', (msg) => {
  //   console.log('[worker id (%d)] msg %s',worker.id, msg);
  // });



}



process.on('uncaughtException', function (err) {
    log.error((new Date).toUTCString() + ' uncaughtException:', err.message);
    log.error(err.stack);
    process.exit(1);
});
