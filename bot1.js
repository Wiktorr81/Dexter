const Discord = require('discord.js');
const bot = new Discord.Client({ fetchAllMembers: true });
const config = require('./config.json');
const fs = require('fs');
const moment = require('moment');
const pushover = require('./helpers/pushover');
const display = require('./helpers/display-o-tron');
const presence = require('./helpers/presence');

const log = function(msg) {
  console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${msg}`);
};

bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();

// Load in all commands in ./commands
fs.readdir('./commands/', function(err, files){
  if (err) console.error(err);
  log(`Loading a total of ${files.length} commands.`);
  files.forEach(function(f){
    let props = require(`./commands/${f}`);
    log(`Loading Command: ${props.help.name}.`);
    bot.commands.set(props.help.name, props);
    props.conf.aliases.forEach(function(alias){
      bot.aliases.set(alias, props.help.name);
    });
  });
});

bot.on('message', function(msg){
  // Exit if message is from a bot
  if(msg.author.bot) return;

  // Add reaction when people are mad at shitwizard
  if(msg.content.indexOf('damn') != -1 && msg.content.indexOf('shitwizard')) {
    msg.react('😎');
  }

  // Exit if no prefix
  if(!msg.content.startsWith(config.prefix)) return;

  // Get command
  let command = msg.content.split(' ')[0];
  command = command.slice(config.prefix.length);

  // Log what was used
  log(`${msg.author.username} used '${msg.content}'`);
  if (command != 'display') {
    display.write([msg.author.username, msg.content], [255, 241, 109]);
  }

  // Get arguments
  let args = msg.content.split(' ').slice(1);

  let cmd;

  // Check if bot has command
  if (bot.commands.has(command)) {
    cmd = bot.commands.get(command);
  } else if (bot.aliases.get(command)) {
    cmd = bot.commands.get(bot.aliases.get(command));
  } else {
    pushover.send(`Suggestion: ${msg.author.username} used '${msg.content}'`);
  }

  // Run command
  if (cmd && cmd.conf.enabled) {
    cmd.run(bot, msg, args);
  } else {
    msg.react(`I'm sorry ${msg.author.username}, I'm afraid I can't do that.`);
  }
});

bot.on('presenceUpdate', function(oldMember, newMember) {
  presence.update(newMember);
});

bot.on('ready', function() {
  let guild = bot.guilds.first();

  log(`Shitwizard is ready! 😎 \n`);
  log(process.env.RASPBERRYPI);
  pushover.send(`Shitwizard is ready! 😎`);
  display.write('Online!', [171, 229, 57]);

  // Update member presence on ready
  guild.members.forEach(function(member){
    presence.update(member);
  });
});

bot.on('disconnect', function() {
  log('Disconnected! 😭');
  pushover.send(`Shitwizard disconnected! 😭`);
  display.write('Disconnected!', [236, 35, 21]);
});

bot.on('reconnecting', function() {
  log('Reconnecting...');
  pushover.send(`Shitwizard reconnecting...`);
  display.write('Reconnecting...', [235, 86, 226]);
});

bot.on('error', function(e) {
  console.error(e);
  pushover.send(`Shitwizard error: ${e}`);
});

bot.login(process.env.DISCORD_TOKEN);
