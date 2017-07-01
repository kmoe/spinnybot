const fs = require('fs');
const winston = require('winston');

const Telegraf = require('telegraf');
const { Extra, memorySession, reply, Markup } = Telegraf;

const { SPINNY_TELEGRAM_API_TOKEN } = process.env;

winston.add(winston.transports.File, {
  filename: 'log.log',
  handleExceptions: true,
  humanReadableUnhandledException: true,
  exitOnError: false,
});

const bot = new Telegraf(SPINNY_TELEGRAM_API_TOKEN);
bot.catch((err) => {
  winston.error(`error ${err}, continuing`);
});

// logger middleware
bot.use((ctx, next) => {
  winston.info(ctx.message);
  const start = new Date();
  return next().then(() => {
    const ms = new Date() - start;
    winston.verbose('response time %sms', ms);
  });
});

bot.use(memorySession());

bot.command('spinny', (ctx, next) => {
  return ctx.reply(getDialogueString(ctx.message.text));
});

bot.use(Telegraf.mount('message', (ctx, next) => {
  return ctx.reply(ctx.message.text + '?');
}));

fs.readFile('ethics', 'utf8', (err, data) => {
  if (err) {
    return winston.error('could not read ethics, aborting');
  }

  const sentences = data
    .replace(/Q\.E\.D\.|\[[0-9]{0,2}\]/, "")
    .match(/.*?(?:\.|!|\?)(?:(?=[A-Z0-9])|$)/g); 

  if (!sentences) {
    return winston.error('no sentences in ethics, aborting');
  }

  DIALOGUE_STRINGS = sentences;

  bot.startPolling();
});

function getDialogueString(message) { 
  const query = message.replace("/spinny", "");
  winston.info('getting dialogue string for query ' + query);
  
  if (query !== "") {
    const matches = DIALOGUE_STRINGS.filter((sentence) => {
      return sentence.indexOf(query) > -1;
    });

    const index = roll(matches.length);
    return matches[index];
  }
  
  const index = roll(DIALOGUE_STRINGS.length);
  return DIALOGUE_STRINGS[index];
}

function roll(maxValue) {
  return Math.floor(Math.random() * maxValue);
}