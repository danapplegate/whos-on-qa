var express = require('express');
var bodyParser = require('body-parser');
var Slackhook = require('slackhook');
var AWS = require('aws-sdk');

var app = express();

var slack = new Slackhook({
    domain: process.env.SLACKHOOK_DOMAIN,
    token: process.env.SLACKHOOK_TOKEN
});
AWS.config.update({region: 'us-east-1'});
var opsworks = new AWS.OpsWorks();

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: false}));

app.post('/outgoing', function(req, res) {
    var hook = slack.respond(req.body);
    var config = {
        StackId: 'c7dffdc5-7a1a-4968-8d23-1221457e1449'
    };
    opsworks.describeDeployments(config, function(err, data) {
        res.json({
            text: err || data.Deployments,
            username: hook.user_name
        });
    });
});

var server = app.listen(app.get('port'), function() {
    console.log("Listening on port %d", server.address().port);
})