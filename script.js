'use strict';

const Script = require('smooch-bot').Script;

module.exports = new Script({
    processing: {
        prompt: (bot) => bot.say('Beep boop...'),
        receive: () => 'processing'
    },

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
                .then(() => 'finish');
        }
    },

    finish: {
        receive: (bot, message) => {
            const answer = message.text;
            return bot.setProp('asnwer', answer)
                .then(() => bot.say(`Your answer: ${answer}`))
                .then(() => 'askWhatWant')
        }
    }

    // finish: {
    //     prompt: (bot) => bot.say('What can I do for you?'),
    //     receive: (bot, message) => {
    //         return bot.getProp('name')
    //             .then((name) => bot.say(`Alright ${name}, let me check..`))
    //             .then(() => 'finish');
    //     }
    // }
});
