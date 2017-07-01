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

bot.command('spinny', (ctx, next) => {
  winston.info('spinny');

  return ctx.reply(getDialogueString(ctx.message.text));
});

bot.use(Telegraf.mount('message', (ctx, next) => {
  const msg = ctx.message.text;

  return ctx.reply(msg + '?');
}));

fs.readFile('ethics', 'utf8', (err, data) => {
  if (err) {
    return winston.error('could not read ethics, aborting');
  }

  const sentences = data.match(/.*?(?:\.|!|\?)(?:(?=[A-Z0-9])|$)/g); //TODO: spinoza regular expression

  if (!sentences) {
    return winston.error('no sentences in ethics, aborting');
  }

  DIALOGUE_STRINGS = sentences;

  bot.startPolling();
});

function getDialogueString(query) { //query is whatever the user typed in
  const index = Math.floor(Math.random() * DIALOGUE_STRINGS.length); 

  return DIALOGUE_STRINGS[index];
}