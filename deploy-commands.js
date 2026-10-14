require('dotenv').config();
const { REST, Routes } = require('discord.js');
const commands = require('./commands.json');
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
  throw new Error('أكمل DISCORD_TOKEN وCLIENT_ID وGUILD_ID داخل .env');
}
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands })
  .then(() => console.log('تم تسجيل أوامر السيرفر التجريبي.'))
  .catch(console.error);
