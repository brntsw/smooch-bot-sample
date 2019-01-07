'use strict';

const smoochBot = require('smooch-bot');
const dialogflow = require('dialogflow')
const { Storage } = require('@google-cloud/storage');
const MemoryLock = smoochBot.MemoryLock;
const SmoochApiStore = smoochBot.SmoochApiStore;
const SmoochApiBot = smoochBot.SmoochApiBot;
const StateMachine = smoochBot.StateMachine;
const app = require('../app');
const script = require('../script');
const SmoochCore = require('smooch-core');
const jwt = require('../jwt');

const name = 'SmoochBot';
const avatarUrl = 'https://s.gravatar.com/avatar/f91b04087e0125153623a3778e819c0a?s=80';
const store = new SmoochApiStore({
    jwt
});
const lock = new MemoryLock();
const webhookTriggers = ['message:appUser', 'postback'];

function createWebhook(smoochCore, target) {
    return smoochCore.webhooks.create({
        target,
        triggers: webhookTriggers
    })
        .then((res) => {
            console.log('Smooch webhook created with target', res.webhook.target);
        })
        .catch((err) => {
            console.error('Error creating Smooch webhook:', err);
            console.error(err.stack);
        });
}

function updateWebhook(smoochCore, existingWebhook) {
    return smoochCore.webhooks.update(existingWebhook._id, {
        triggers: webhookTriggers
    })
        .then((res) => {
            console.log('Smooch webhook updated with missing triggers', res.webhook.target);
        })
        .catch((err) => {
            console.error('Error updating Smooch webhook:', err);
            console.error(err.stack);
        });
}

// Create a webhook if one doesn't already exist
if (process.env.SERVICE_URL) {
    const target = process.env.SERVICE_URL.replace(/\/$/, '') + '/webhook';
    const smoochCore = new SmoochCore({
        jwt
    });
    smoochCore.webhooks.list()
        .then((res) => {
            const existingWebhook = res.webhooks.find((w) => w.target === target);

            if (!existingWebhook) {
                return createWebhook(smoochCore, target);
            }

            const hasAllTriggers = webhookTriggers.every((t) => {
                return existingWebhook.triggers.indexOf(t) !== -1;
            });

            if (!hasAllTriggers) {
                updateWebhook(smoochCore, existingWebhook);
            }
        });
}

function createBot(appUser) {
    const userId = appUser.userId || appUser._id;
    return new SmoochApiBot({
        name,
        avatarUrl,
        lock,
        store,
        userId
    });
}

async function handleMessages(projectId = 'k2agent-7a814', message) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = "/Users/brunopardini/Documents/SmoochWebhook/k2agent-7a814-38020ccf4144.json"

    const storage = new Storage({
        keyFilename: '/Users/brunopardini/Documents/SmoochWebhook/k2agent-7a814-38020ccf4144.json'
    });
    storage.
        getBuckets()
        .then((results) => {
            const buckets = results[0];
            console.log("Buckets:");
            buckets.forEach((bucket) => {
                console.log(bucket.name);
            })
        })
        .catch((err) => {
            console.error('Error: ', err);
        })

    const messages = req.body.messages.reduce((prev, current) => {
        if (current.role === 'appUser') {
            prev.push(current);
        }
        return prev;
    }, []);

    const sessionClient = new dialogflow.SessionsClient();
    const sessionPath = sessionClient.sessionPath(projectId, "d61973bcd0264746b88d0aed5bbdd6a5");

    const request = {
        session: sessionPath,
        queryInput: {
            text:{
                text: message,
                languageCode: 'en-US'
            }
        }
    };

    const responses = await sessionClient.detectIntent(request);
    console.log('Detected intent');
    const result = responses[0].queryResult;

    return result.fulfillmentText;

    // if (messages.length === 0) {
    //     return res.end();
    // }

    // const stateMachine = new StateMachine({
    //     script,
    //     bot: createBot(req.body.appUser)
    // });

    // stateMachine.receiveMessage(messages[0])
    //     .then(() => res.end())
    //     .catch((err) => {
    //         console.error('SmoochBot error:', err);
    //         console.error(err.stack);
    //         res.end();
    //     });
}

function handlePostback(req, res) {
    const postback = req.body.postbacks[0];
    if (!postback || !postback.action) {
        res.end();
    }

    handleMessages('k2agent-7a814', ${postback.action.text}).then((result) => {
        createBot(req.body.appUser).say(`You said: ${result} (payload was: ${postback.action.payload})`)
        .then(() => res.end());
    })
}

app.post('/webhook', function(req, res, next) {
    // const trigger = req.body.trigger;

    // switch (trigger) {
    //     case 'message:appUser':
    //         handleMessages(req, res);
    //         break;

    //     case 'postback':
    //         handlePostback(req, res);
    //         break;

    //     default:
    //         console.log('Ignoring unknown webhook trigger:', trigger);
    // }
    console.log("test");
});

var server = app.listen(process.env.PORT || 8000, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Smooch Bot listening at http://%s:%s', host, port);
});
