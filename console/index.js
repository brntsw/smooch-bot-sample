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
        prompt: (bot) => bot.say('What\'s your name'),
        receive: (bot, message) => {
            const name = message.text.trim();
            bot.setProp('name', name);
            return bot.say(`I'll call you ${name}! Great!`)
                .then(() => 'askWhatCanDo');
        }
    },

    askWhatCanDo: {
        prompt: (bot) => bot.say(`What can I do for you ${name}?`),
        receive: (bot, message) => {
            const answer = message.text.trim();
            bot.setProp('answer', answer)
            return bot.say(`Wait just a second..`)
                .then(() => 'finish')
        }
    },

// TODO Implement a function to integrate with DialogFlow.
    //Send the data like done on the Android app, which obtain a callback with the response and, after receiving the text from DialogFlow, it sends back to Smooch and it
    //sends back to the customer channel

    finish: {
        receive: (bot, message) => {
            return bot.getProp('name')
                .then((name) => bot.say(`Sorry ${name}, my creator didn't ` +
                        'teach me how to do anything else!'))
                .then(() => 'finish');
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
    runSample('k2agent-7a814', data.toString().trim()).then((result) => {
        console.log(result);
        // stateMachine.receiveMessage({
        //     text: result
        // })
        // .catch((err) => {
        //     console.error(err);
        //     console.error(err.stack);
        // });
    }).catch((err) => {
        console.error(err);
        console.error(err.stack);
    });
});
