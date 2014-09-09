var Slackhook = require('slackhook');
var express = require('express');
var app = express();

var slack = new Slackhook({
    domain: 'skillshare.slack.com',
    token: '3LoaE3ImtN3kfAJZ7xCLnMQk'
});

app.use(express.urlencoded());

app.post('/outgoing', function(req, res) {
    console.log(req.body);
    var hook = slack.respond(req.body);
    res.json({text: 'Hi ' + hook.user_name, username: 'Dr. Nick'});
});

var server = app.listen(5000, function() {
    console.log("Listening on port %d", server.address().port);
})