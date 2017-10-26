var config = {};

config.port = 3000; // nodeJS port

config.backend = {
  redis: {
    port : 6379,
    host : '127.0.0.1'
  }
};

config.workers = {
  name: ['Goofy', 'Pluto', 'Mickey Mouse', 'Donald Duck', 'Robin Hood', 'Dumbo', 'Peter Pan', 'Aladdin', 'Pocahontas', 'Wall-E']
};

config.generator = {
  stringSize: 5,
  timeout: 1000
};

config.eventhandler = {
  poll_period: 500 //ms
};

module.exports = config;
