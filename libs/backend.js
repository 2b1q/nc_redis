var Redis = require('promise-redis')(),
    config = require('../config/config');

var redis = Redis.createClient(config.backend.redis.port, config.backend.redis.host);

function checkRedisReadyState() {
    return new Promise((resolve,reject) => {
        redis.once('ready', () => {redis.removeAllListeners('error'); resolve()});
        redis.once('error', e => reject(e));
    });
}

function init() {
    return Promise.all([
        checkRedisReadyState()
    ]);
}

module.exports = {
    redis: redis,
    init:  init
};
