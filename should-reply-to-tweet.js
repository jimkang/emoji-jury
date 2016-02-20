var config = require('./config/config');
var callNextTick = require('call-next-tick');
var betterKnowATweet = require('better-know-a-tweet');
var async = require('async');
var behavior = require('./behavior');

var username = behavior.twitterUsername;

// Passes an error if you should not reply.
function shouldReplyToTweet(opts, done) {
  var tweet;
  var chronicler;
  var waitingPeriod = behavior.hoursToWaitBetweenRepliesToSameUser;

  if (opts) {
    tweet = opts.tweet;
    chronicler = opts.chronicler;
  }

  if (tweet.user.screen_name.toLowerCase() === username.toLowerCase()) {
    callNextTick(done, new Error('Subject tweet is own tweet.'));
    return;
  }

  if (betterKnowATweet.isRetweetOfUser(username, tweet)) {
    callNextTick(done, new Error('Subject tweet is own retweet.'));
    return;
  }

  if (!doesTweetMentionBot(tweet)) {
    callNextTick(done, new Error('Not mentioned; not replying.'));
    return;
  }

  async.waterfall(
    [
      goFindLastReplyDate,
      replyDateWasNotTooRecent
    ],
    done
  );

  function goFindLastReplyDate(done) {
    findLastReplyDateForUser(tweet, done);
  }

  function findLastReplyDateForUser(tweet, done) {
    chronicler.whenWasUserLastRepliedTo(
      tweet.user.id_str, passLastReplyDate
    );

    function passLastReplyDate(error, date) {
      // Don't pass on the error – `whenWasUserLastRepliedTo` can't find a
      // key, it returns a NotFoundError. For us, that's expected.
      if (error && error.type === 'NotFoundError') {
        error = null;
        date = new Date(0);
      }
      done(error, tweet, date);
    }
  }

  function replyDateWasNotTooRecent(tweet, date, done) {
    if (typeof date !== 'object') {
      date = new Date(date);
    }
    var hoursElapsed = (Date.now() - date.getTime()) / (60 * 60 * 1000);
    if (hoursElapsed > waitingPeriod) {
      done();
    }
    else {
      done(new Error(
        `Replied ${hoursElapsed} hours ago to ${tweet.user.screen_name}.
        Need at least ${waitingPeriod} to pass.`
      ));
    }
  }
}

function doesTweetMentionBot(tweet) {
  var usernames = betterKnowATweet.whosInTheTweet(tweet).map(lowerCase);
  return usernames && usernames.indexOf(username.toLowerCase()) !== -1;
}

function lowerCase(s) {
  return s.toLowerCase();
}

module.exports = shouldReplyToTweet;
