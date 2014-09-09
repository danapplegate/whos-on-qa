var Slackhook = require('slackhook');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var slack = new Slackhook({
    domain: process.env.SLACKHOOK_DOMAIN,
    token: process.env.SLACKHOOK_TOKEN
});

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: false}));

app.post('/outgoing', function(req, res) {
    console.log(req.body);
    var hook = slack.respond(req.body);
    res.json({text: 'Hi ' + hook.user_name, username: hook.user_name});
});

var server = app.listen(app.get('port'), function() {
    console.log("Listening on port %d", server.address().port);
})