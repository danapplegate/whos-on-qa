var _ = require('underscore');
var moment = require('moment');
var express = require('express');
var bodyParser = require('body-parser');
var Slackhook = require('slackhook');
var AWS = require('aws-sdk');

var app = express();

var stacks = {
    'c7dffdc5-7a1a-4968-8d23-1221457e1449': 'qa',
    '3d75b511-fdeb-4d42-b3a1-24bf995e4b9b': 'qa-2',
    'c3a26829-7a20-4a54-a7d7-e8766a0925bd': 'qa-3',
    '9849ffb5-ebae-4ac4-8f33-442e2a617216': 'qa-4',
    '3fe0ee97-e4ce-4b49-80f5-f095250fb606': 'qa-api'
};
var slack = new Slackhook({
    domain: process.env.SLACKHOOK_DOMAIN,
    token: process.env.SLACKHOOK_TOKEN
});
AWS.config.update({
    region: 'us-east-1',
    sslEnabled: true
});
var opsworks = new AWS.OpsWorks();

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req, res) {
    res.send('Welcome to the Who\'s on QA bot!');
});

app.post('/outgoing', function(req, res) {
    var hook = slack.respond(req.body);

    var stacksToProcess = _.keys(stacks);
    var responseLines = [];
    _.each(stacks, function(name, stackId) {
        var opsReq = opsworks.describeDeployments({StackId: stackId});
        opsReq.on('success', function(response) {
            var validDeployments = _.filter(response.data.Deployments, function(deployment) {
                return deployment.IamUserArn;
            });
            var deployment = _.first(validDeployments),
                stackName = stacks[deployment.StackId],
                usernameParts = deployment.IamUserArn.split(':'),
                namePath = usernameParts.pop(),
                userName = namePath.substring(5),
                created = moment.parseZone(deployment.CreatedAt).zone('-04:00'),
                createdString = created.format('llll Z');
            responseLines.push(stackName + ': user ' + userName + ' since ' + createdString);
            stacksToProcess = _.without(stacksToProcess, stackId);
        });
        opsReq.on('error', function(error) {
            responseLines.push(stacks[stackId] + ': Error - ' + error.message);
            stacksToProcess = _.without(stacksToProcess, stackId);
        });
        opsReq.on('complete', function() {
            if (stacksToProcess.length == 0) {
                slack.send({
                    text: 'Current QA status',
                    username: "Who's on QA Bot",
                    attachments: [{
                        fallback: '```' + responseLines.join("\n") + '```',
                        color: 'good',
                        fields: [
                            {
                                'title': 'QA Stacks',
                                'value': responseLines.join("\n")
                            }
                        ]
                    }]
                });
                res.send();
            }
        });
        opsReq.send();
    });
});

var server = app.listen(app.get('port'), function() {
    console.log("Listening on port %d", server.address().port);
})