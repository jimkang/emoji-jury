#!/usr/bin/env node

var config = require('./config/config');
var callNextTick = require('call-next-tick');
var Twit = require('twit');
var async = require('async');
var createChronicler = require('basicset-chronicler').createChronicler;
var behavior = require('./behavior');
var shouldReplyToTweet = require('./should-reply-to-tweet');
var composeJuryReply = require('./compose-jury-reply');
var postTweetChain = require('post-tweet-chain');

var dryRun = false;
if (process.argv.length > 2) {
  dryRun = (process.argv[2].toLowerCase() == '--dry');
}

var username = behavior.twitterUsername;

var chronicler = createChronicler({
  dbLocation: __dirname + '/data/jury-chronicler.db'
});

var twit = new Twit(config.twitter);
var streamOpts = {
  replies: 'all'
};
var stream = twit.stream('user', streamOpts);

stream.on('tweet', respondToTweet);
stream.on('error', logError);

function respondToTweet(incomingTweet) {
  async.waterfall(
    [
      checkIfWeShouldReply,
      composeReply,
      postTweet,
      recordThatReplyHappened
    ],
    wrapUp
  );

  function checkIfWeShouldReply(done) {
    var opts = {
      tweet: incomingTweet,
      chronicler: chronicler
    };
    shouldReplyToTweet(opts, done);
  }

  function composeReply(done) {
    composeJuryReply(incomingTweet, done);
  }

  function postTweet(text, done) {
    if (dryRun) {
      console.log('Would have tweeted:', text);
      var mockTweetData = {
        user: {
          id_str: 'mockuser',        
        }
      };
      callNextTick(done, null, mockTweetData);
    }
    else {
      var body = {
        status: text,
        in_reply_to_status_id: incomingTweet.id_str
      };      
      twit.post('statuses/update', body, done);
    }
  }

  function recordThatReplyHappened(outgoingTweetData, response, done) {
    var userId = incomingTweet.user.id_str;
    chronicler.recordThatUserWasRepliedTo(userId, done);
  }  
}

function wrapUp(error, data) {
  if (error) {
    console.log(error, error.stack);

    if (data) {
      console.log('data:', data);
    }
  }
}

function logError(error) {
  console.log(error);
}
