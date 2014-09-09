var _ = require('underscore');
var express = require('express');
var bodyParser = require('body-parser');
var Slackhook = require('slackhook');
var AWS = require('aws-sdk');

var app = express();

var stacks = {
    'c7dffdc5-7a1a-4968-8d23-1221457e1449': 'qa',
    '3d75b511-fdeb-4d42-b3a1-24bf995e4b9b': 'qa-2',
    'c3a26829-7a20-4a54-a7d7-e8766a0925bd': 'qa-3',
    '9849ffb5-ebae-4ac4-8f33-442e2a617216': 'qa-4'
};
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
    opsworks.describeDeployments({}, function(err, data) {
        console.log(data);
        if (err) {
            res.json({text: 'OpsWorks error: ' + err.message});
        } else {
            var validDeployments = _.filter(data.Deployments, function(deployment) {
                return deployment.IamUserArn;
            });
            var groupedDeployments = _.groupBy(validDeployments, function(deployment) {
                return deployment.StackId;
            });
            var configuredDeployments = _.pick(groupedDeployments, _.keys(stacks));
            var responseLines = [];
            _.each(configuredDeployments, function(deployments, stackId) {
                var deployment = _.first(deployments),
                    stackName = stacks[deployment.StackId],
                    usernameParts = deployment.IamUserArn.split(':'),
                    namePath = usernameParts.pop(),
                    name = namePath.substring(5),
                    created = new Date(deployment.CreatedAt),
                    createdString = created.toLocaleString('en-US', {timeZone: 'America/New_York'});
                responseLines.push(stackName + ': user ' + name + ' since ' + createdString);
            });
            res.json({
                text: '```' + responseLines.join("\n") + '```',
                username: "Who's on QA Bot"
            });
        }
    });
});

var server = app.listen(app.get('port'), function() {
    console.log("Listening on port %d", server.address().port);
})