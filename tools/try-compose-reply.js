var composeJuryReply = require('../compose-jury-reply');

var mockTweet = {
  user: {
    screen_name: 'smidgeo'
  }
};

composeJuryReply(mockTweet, logReply);

function logReply(error, reply) {
  if (error) {
    console.log(error);
  }
  else {
    console.log(reply);
  }
}
