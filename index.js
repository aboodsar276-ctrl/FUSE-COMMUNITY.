require('dotenv').config();
require('./deploy-commands.js');
const fs = require('node:fs');
const path = require('node:path');
const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Client, EmbedBuilder,
  Events, GatewayIntentBits, MessageFlags, PermissionFlagsBits
} = require('discord.js');
const config = require('./config.json')

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const warningsFile = path.join(dataDir, 'warnings.json');
if (!fs.existsSync(warningsFile)) fs.writeFileSync(warningsFile, '{}');
const getWarnings = () => JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
const saveWarnings = data => fs.writeFileSync(warningsFile, JSON.stringify(data, null, 2));
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, c => console.log(`تم تسجيل الدخول باسم ${c.user.tag}`));
client.on(Events.GuildMemberAdd, async member => {
  const channel = await member.guild.channels
    .fetch(config.welcomeChannelId)
    .catch(() => null);

  if (!channel) return;

  const welcomeText = config.welcomeMessage
    .replaceAll('{user}', `<@${member.id}>`)
    .replaceAll('{server}', member.guild.name);

  await channel.send({
    content: welcomeText,
    embeds: [
      new EmbedBuilder()
        .setColor(0x5b21b6)
        .setTitle(member.displayName)
        .setDescription(
          `Welcome to the server!\nWelcome <@${member.id}> to our family ✦`
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .addFields(
          {
            name: 'Rules',
            value: '<#1556019029011992706>',
            inline: true
          },
          {
            name: 'Members',
            value: `${member.guild.memberCount}`,
            inline: true
          }
        )
        .setImage('attachment://welcome-decoration.png')
    ],
    files: ['./welcome-decoration.png']
  }).catch(console.error);
});
client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;
  const found = config.autoReplies.find(x => message.content.toLowerCase().includes(x.trigger.toLowerCase()));
  if (found) await message.reply(found.response).catch(() => {});
});
async function log(guild, title, description) {
  if (!config.logChannelId) return;
  const channel = await guild.channels.fetch(config.logChannelId).catch(() => null);
  if (channel) await channel.send({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(title).setDescription(description).setTimestamp()] }).catch(() => {});
}
async function closeTicket(interaction) {
  const topic = interaction.channel.topic || '';
  const owner = topic.startsWith('ticket:') ? topic.slice(7) : '';
  const support = config.supportRoleId && interaction.member.roles?.cache?.has(config.supportRoleId);
  if (!owner) return interaction.reply({ content: 'هذه القناة ليست تذكرة.', flags: MessageFlags.Ephemeral });
  if (owner !== interaction.user.id && !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels) && !support)
    return interaction.reply({ content: 'إغلاق التذكرة متاح لصاحبها وفريق الدعم فقط.', flags: MessageFlags.Ephemeral });
  await interaction.reply('سيتم إغلاق التذكرة خلال ثوانٍ.');
  setTimeout(() => interaction.channel.delete('إغلاق تذكرة').catch(() => {}), 4000);
}
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton() && interaction.customId === 'ticket:create') {
    const exists = interaction.guild.channels.cache.find(c => c.topic === `ticket:${interaction.user.id}`);
    if (exists) return interaction.reply({ content: `لديك تذكرة مفتوحة: ${exists}`, flags: MessageFlags.Ephemeral });
    const overwrites = [
      { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ];
    if (config.supportRoleId) overwrites.push({ id: config.supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90) || `ticket-${interaction.user.id.slice(-5)}`,
      type: ChannelType.GuildText, parent: config.ticketCategoryId || undefined,
      topic: `ticket:${interaction.user.id}`, permissionOverwrites: overwrites
    });
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:close').setLabel('إغلاق التذكرة').setEmoji('🔒').setStyle(ButtonStyle.Danger));
    await channel.send({ content: `${interaction.user} أهلًا بك! اشرح طلبك وسيقوم فريق الدعم بمساعدتك.`, components: [row] });
    return interaction.reply({ content: `تم فتح تذكرتك: ${channel}`, flags: MessageFlags.Ephemeral });
  }
  if (interaction.isButton() && interaction.customId === 'ticket:close') return closeTicket(interaction);
  if (!interaction.isChatInputCommand()) return;
  const { commandName: name, guild, options, member } = interaction;
  try {
    if (name === 'setup') {
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:create').setLabel('فتح تذكرة').setEmoji('🎫').setStyle(ButtonStyle.Primary));
      await interaction.channel.send({ content: config.ticketMessage, components: [row] });
      return interaction.reply({ content: 'تم إرسال لوحة التذاكر.', flags: MessageFlags.Ephemeral });
    }
    if (name === 'ticket') return closeTicket(interaction);
    if (name === 'ban' || name === 'kick') {
      const user = options.getUser('عضو'), reason = options.getString('السبب') || 'لم يذكر سبب';
      const target = await guild.members.fetch(user.id);
      if (name === 'ban') await target.ban({ reason }); else await target.kick(reason);
      await interaction.reply(`تم ${name === 'ban' ? 'حظر' : 'طرد'} ${user.tag}. السبب: ${reason}`);
      await log(guild, name === 'ban' ? 'حظر عضو' : 'طرد عضو', `${user.tag} — ${reason}`); return;
    }
    if (name === 'timeout') {
      const user = options.getUser('عضو'), minutes = options.getInteger('الدقائق'), reason = options.getString('السبب') || 'لم يذكر سبب';
      await (await guild.members.fetch(user.id)).timeout(minutes * 60000, reason);
      await interaction.reply(`تم إسكات ${user.tag} لمدة ${minutes} دقيقة.`); await log(guild, 'إسكات عضو', `${user.tag} لمدة ${minutes} دقيقة — ${reason}`); return;
    }
    if (name === 'unban') { const id = options.getString('معرف'); await guild.members.unban(id); return interaction.reply(`تم إلغاء حظر <@${id}>.`); }
    if (name === 'warn') {
      const user = options.getUser('عضو'), reason = options.getString('السبب'), data = getWarnings(), key = `${guild.id}:${user.id}`;
      data[key] ??= []; data[key].push({ reason, by: interaction.user.tag, at: new Date().toISOString() }); saveWarnings(data);
      await interaction.reply(`تم تسجيل إنذار على ${user.tag}.`); await log(guild, 'إنذار', `${user.tag} — ${reason}`); return;
    }
    if (name === 'warnings') {
      const user = options.getUser('عضو'), list = getWarnings()[`${guild.id}:${user.id}`] || [];
      return interaction.reply({ content: list.length ? list.map((w, i) => `${i + 1}. ${w.reason} — ${w.by}`).join('\n') : 'لا توجد إنذارات مسجلة.', flags: MessageFlags.Ephemeral });
    }
    if (name === 'clear') {
      const result = await interaction.channel.bulkDelete(options.getInteger('العدد'), true);
      return interaction.reply({ content: `تم حذف ${result.size} رسالة.`, flags: MessageFlags.Ephemeral });
    }
    if (name === 'say') { await interaction.channel.send(options.getString('النص')); return interaction.reply({ content: 'تم إرسال الإعلان.', flags: MessageFlags.Ephemeral }); }
    if (name === 'server') return interaction.reply(`**${guild.name}**\nالأعضاء: ${guild.memberCount}\nتاريخ الإنشاء: <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`);
  } catch (error) {
    console.error(error);
    const response = { content: 'تعذر تنفيذ الأمر. تحقق من صلاحيات البوت ورتبته وإعدادات السيرفر.', flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) await interaction.followUp(response).catch(() => {}); else await interaction.reply(response).catch(() => {});
  }
});
if (!process.env.DISCORD_TOKEN) throw new Error('ضع DISCORD_TOKEN داخل ملف .env');
client.login(process.env.DISCORD_TOKEN);
