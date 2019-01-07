'use strict';

const smoochBot = require('smooch-bot');
const dialogflow = require('dialogflow')
const { Storage } = require('@google-cloud/storage');
const uuid = require('uuid')
const MemoryStore = smoochBot.MemoryStore;
const MemoryLock = smoochBot.MemoryLock;
const Bot = smoochBot.Bot;
const Script = smoochBot.Script;
const StateMachine = smoochBot.StateMachine;

class ConsoleBot extends Bot {
    constructor(options) {
        super(options);
    }

    say(text) {
        return new Promise((resolve) => {
            console.log(text);
            resolve();
        });
    }
}

const script = new Script({
    start: {
        receive: (bot) => {
            return bot.say('Hi! I\'m Smooch Bot!')
                .then(() => 'askName');
        }
    },

    askName: {
        prompt: (bot) => bot.say('What\'s your name?'),
        receive: (bot, message) => {
            const name = message.text;
            return bot.setProp('name', name)
                .then(() => bot.say(`Great! I'll call you ${name}
What can I do for you?`))
                .then(() => 'askWhatWant');
        }
    },

    askWhatWant: {
        receive: (bot, message) => {
            const answer = message.text;
            return bot.setProp('asnwer', answer)
                .then(() => bot.say(`Your answer: ${answer}`))
                .then(() => 'askWhatWant')
        }
    }
});

async function runSample(projectId = 'k2agent-7a814', message){
    //Authentication
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

    const sessionId = uuid.v4();

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
}

const userId = 'testUserId';
const store = new MemoryStore();
const lock = new MemoryLock();
const bot = new ConsoleBot({
    store,
    lock,
    userId
});

const stateMachine = new StateMachine({
    script,
    bot,
    userId
});

process.stdin.on('data', function(data) {
    stateMachine.receiveMessage({
        text: data.toString().trim()
    })
        .catch((err) => {
            console.error(err);
            console.error(err.stack);
        });
    // runSample('k2agent-7a814', data.toString().trim()).then((result) => {
    //     console.log(result);
    //     stateMachine.receiveMessage({
    //         text: result
    //     })
    //     .catch((err) => {
    //         console.error(err);
    //         console.error(err.stack);
    //     });
    // }).catch((err) => {
    //     console.error(err);
    //     console.error(err.stack);
    // });
});
