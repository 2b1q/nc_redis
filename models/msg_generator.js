var config = require('../config/config'),
    crypto = require('crypto'),
    randstr = require('randomstring'),
    secret = 'SuperSecretSalt';

var generateMsg = function(){
  var chars = Math.floor(Math.random() * config.generator.stringSize)+1, // string size
      rand_string = randstr.generate(chars); // generate random string
  return crypto.createHmac('sha256', secret).update(rand_string).digest('hex')
};

var getHash = function(id){
  var id = id || '1';
  return crypto.createHash('md5').update(id).digest('hex')
  // return crypto.createHash('md5').update((url || this.url)).digest('hex');;
}

module.exports.msg = generateMsg;
module.exports.hashid = getHash;
