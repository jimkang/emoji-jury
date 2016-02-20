var moment = require('moment');
var tracery = require('tracery-grammar');
var jsonfile = require('jsonfile');
var callNextTick = require('call-next-tick');

var grammarSpec = jsonfile.readFileSync(__dirname + '/emoji-jury.json');
var processedGrammar = tracery.createGrammar(grammarSpec);

function composeJuryReply(tweet, done) {
  var prefix = '@' + tweet.user.screen_name + ' ';
  callNextTick(done, null, prefix + processedGrammar.flatten('#judgment_jury#'));
}

module.exports = composeJuryReply;
