var moment = require('moment');
var tracery = require('tracery-grammar');
var jsonfile = require('jsonfile');
var callNextTick = require('call-next-tick');
var createWordnok = require('wordnok').createWordnok;
var config = require('./config/config');
var iscool = require('iscool')();
var probable = require('probable');
var async = require('async');
var WanderGoogleNgrams = require('wander-google-ngrams');

var wordnok = createWordnok({
  apiKey: config.wordnikAPIKey
});

var randomWordsOpts = {
  customParams: {
    includePartOfSpeech: 'adjective'
  }
};

var createWanderStream = WanderGoogleNgrams({
  wordnikAPIKey: config.wordnikAPIKey
});

var grammarSpec = jsonfile.readFileSync(__dirname + '/emoji-jury.json');
var processedGrammar = tracery.createGrammar(grammarSpec);

function getAdjective(done) {
  wordnok.getRandomWords(randomWordsOpts, filterAdjectives);

  function filterAdjectives(error, words) {
    if (error) {
      done(error);
    }
    else {
      var filtered = words.filter(iscool);
      if (filtered.length < 1) {
        done(new Error('Filtered all adjectives.'));
      }
      else {
        var adjective = probable.pickFromArray(filtered);        
        done(null, adjective);
      }
    }
  }
}

function addAdjectiveToJudgment(prefix, judgment, done) {
  getAdjective(assembleFinalJudgment);

  function assembleFinalJudgment(error, adjective) {
    if (error) {
      done(error);
    }
    else {
      done(null, prefix + judgment.replace('{adjective}', adjective));
    }
  }
}

function addNgramChainToJudgment(prefix, judgment, done) {
  async.waterfall(
    [
      getAdjective,
      getNgramChain,
      affixChainToFinalJudgment
    ],
    done
  );

  function affixChainToFinalJudgment(ngramChain, done) {
    done(null, prefix + judgment.replace('{ngram-chain}', ngramChain));
  }
}

function getNgramChain(adjective, done)  {
  var chain = [];

  var opts = {
    word: adjective,
    direction: 'forward',
    repeatLimit: 1,
    tryReducingNgramSizeAtDeadEnds: true,
    shootForASentence: true,
    maxWordCount: 20,
    forwardStages: [
    {
        name: 'pushedAdjective',
        needToProceed: ['preposition'],
        lookFor: '*_ADP',
        disallowCommonBadExits: true
      },
      {
        name: 'pushedPreposition',
        needToProceed: ['noun', 'pronoun', 'noun-plural', 'adjective'],
        lookFor: '*_NOUN',
        disallowCommonBadExits: true
      },
      {
        name: 'done'
      }
    ]
  };

  var stream = createWanderStream(opts);

  stream.on('error', reportError);
  stream.on('data', saveWord);
  stream.on('end', passNgramChain);

  function reportError(error) {
    console.log(error);
  }

  function saveWord(word) {
    chain.push(word);
  }

  function passNgramChain() {
    done(null, chain.join(' '));
  }
}

function composeJuryReply(tweet, done) {
  var prefix = '@' + tweet.user.screen_name + ' ';
  var judgment = processedGrammar.flatten('#judgment_jury#');
  if (judgment.indexOf('{adjective}') !== -1) {
    addAdjectiveToJudgment(prefix, judgment, done);
  }
  else if (judgment.indexOf('{ngram-chain}') !== -1) {
    addNgramChainToJudgment(prefix, judgment, done);
  }
  else {  
    callNextTick(done, null, prefix + judgment);
  }
}

module.exports = composeJuryReply;
