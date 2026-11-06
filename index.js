require('dotenv').config();
require('./deploy-commands.js');
const fs = require('node:fs');
const path = require('node:path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
GlobalFonts.registerFromPath(path.join(__dirname, 'font.ttf'), 'WelcomeFont');
const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Client, EmbedBuilder,
Events, GatewayIntentBits, MessageFlags, PermissionFlagsBits, AuditLogEvent
} = require('discord.js');
const config = require('./config.json')

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const warningsFile = path.join(dataDir, 'warnings.json');
if (!fs.existsSync(warningsFile)) fs.writeFileSync(warningsFile, '{}');
const getWarnings = () => JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
const saveWarnings = data => fs.writeFileSync(warningsFile, JSON.stringify(data, null, 2));
const pointsFile = path.join(dataDir, 'points.json');
if (!fs.existsSync(pointsFile)) fs.writeFileSync(pointsFile, '{}');

const getPoints = () => JSON.parse(fs.readFileSync(pointsFile, 'utf8'));
const savePoints = data => fs.writeFileSync(pointsFile, JSON.stringify(data, null, 2));
const eventPointsFile = path.join(dataDir, 'event-points.json');
if (!fs.existsSync(eventPointsFile)) {
  fs.writeFileSync(eventPointsFile, '{}');
}

const getEventPoints = () =>
  JSON.parse(fs.readFileSync(eventPointsFile, 'utf8'));

const saveEventPoints = data =>
  fs.writeFileSync(eventPointsFile, JSON.stringify(data, null, 2));
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, c => console.log(`تم تسجيل الدخول باسم ${c.user.tag}`));
client.on(Events.GuildMemberAdd, async member => {
  const channel = await member.guild.channels
    .fetch(config.welcomeChannelId)
    .catch(() => null);

  if (!channel) return;

  try {
   const width = 900;
const height = 360;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

const avatar = await loadImage(
  member.displayAvatarURL({ extension: 'png', size: 256 })
);

ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, width, height);

// صورة العضو في الوسط
ctx.save();
ctx.beginPath();
ctx.arc(450, 125, 80, 0, Math.PI * 2);
ctx.clip();
ctx.drawImage(avatar, 370, 45, 160, 160);
ctx.restore();

// اسم العضو تحت صورته
 ctx.font = 'bold 40px WelcomeFont';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = '#ffffff';
ctx.fillText(member.user.username, 450, 280);
    const welcomeImage = await canvas.encode('png');

    const welcomeText = config.welcomeMessage
      .replaceAll('{user}', `<@${member.id}>`)
      .replaceAll('{server}', member.guild.name);

   await channel.send({
  content: `${welcomeText}\nWelcome to the server!\nWelcome <@${member.id}> to our family ✦\n📜 Rules: <#1556019029011992706>\n👥 Members: ${member.guild.memberCount}`,
  files: [{ attachment: welcomeImage, name: 'welcome-card.png' }]
});
} catch (error) {
  console.error('Welcome image error:', error);
}
});
 
    
client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;
  const allowedPointChannels = ['1556560887559618620', '1556596123001692190', '1565213564640296960'];
  if (message.content.trim() === '+استعلام') {
  if (!allowedPointChannels.includes(message.channel.id)) {
  await message.reply('استخدم أحد رومي النقاط المخصصين.').catch(() => {});
  return;
}
  const rows = Object.entries(getPoints())
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, total], index) => `${index + 1}. <@${id}> — **${total}** نقطة`);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('نقاط الأعضاء')
    .setDescription(rows.join('\n') || 'ما في أعضاء معهم نقاط حاليًا.');

  await message.channel.send({ embeds: [embed] });
  return;
}

const pointsTarget = message.mentions.members.first();
const pointsMatch = message.content.trim().match(/^\+نقاط\s+<@!?\d+>\s+([+-])(\d+)$/);

if (pointsTarget && pointsMatch) {
  if (!allowedPointChannels.includes(message.channel.id)) {
  await message.reply('استخدم أحد رومي النقاط المخصصين.').catch(() => {});
  return;
}
  if (!message.member.roles.cache.has('1560413851248496730')) {
    await message.reply('ما عندك صلاحية إضافة نقاط.').catch(() => {});
    return;
  }

  const amount = Number(pointsMatch[2]);
const change = pointsMatch[1] === '+' ? amount : -amount;
  if (amount <= 0) return;

  const points = getPoints();
  points[pointsTarget.id] = Math.max(0, (points[pointsTarget.id] || 0) + change);
  savePoints(points);


const pointsLog = await message.guild.channels
  .fetch('1566391744113811496')
  .catch(() => null);
const rankLevels = [
  { points: 0, id: '1559294398976626729', name: 'Trial Helper' },
  { points: 25, id: '1559297204756156436', name: 'Helper' },
  { points: 55, id: '1559298681856065576', name: 'Support' },
  { points: 90, id: '1559299668184141874', name: 'Moderator' },
  { points: 135, id: '1559300510211768402', name: 'Senior Moderator' },
  { points: 185, id: '1559301778409791629', name: 'Trial Admin' },
  { points: 245, id: '1559302846791286785', name: 'Admin' },
  { points: 315, id: '1559303642572656670', name: 'Senior Admin' },
  { points: 395, id: '1559304253623894036', name: 'Head Admin' },
  { points: 485, id: '1560413851248496730', name: 'High Staff' },
  { points: 585, id: '1559304879766372503', name: 'Supervisor' },
  { points: 700, id: '1559305739124871208', name: 'Management' },
  { points: 800, id: '1559305518831636562', name: 'Head Management' }
];

const ranksToAdd = rankLevels.filter(rank =>
  points[pointsTarget.id] >= rank.points &&
  !pointsTarget.roles.cache.has(rank.id)
);

if (ranksToAdd.length) {
  try {
    await pointsTarget.roles.add(ranksToAdd.map(rank => rank.id));

    const highestRank = ranksToAdd[ranksToAdd.length - 1];

    await message.channel.send(
  `🎉 مبروك ${pointsTarget}، لقد ترقيت لرتبة **${highestRank.name}** ❤️❤️`
);
  } catch (error) {
    console.error('Promotion role error:', error);
  }
}
  const ranksToRemove = rankLevels.filter(rank =>
  points[pointsTarget.id] < rank.points &&
  pointsTarget.roles.cache.has(rank.id)
);

if (ranksToRemove.length) {
  await pointsTarget.roles
    .remove(ranksToRemove.map(rank => rank.id))
    .catch(error => console.error('Demotion role error:', error));
}
if (pointsLog) {
  const logEmbed = new EmbedBuilder()
    .setColor(change > 0 ? 0x57f287 : 0xed4245)
    .setTitle('📊 سجل النقاط')
    .addFields(
      { name: 'الإداري', value: message.author.tag, inline: true },
      { name: 'العضو', value: pointsTarget.user.tag, inline: true },
      { name: 'التعديل', value: `${change > 0 ? '+' : ''}${change}`, inline: true },
      { name: 'المجموع الجديد', value: String(points[pointsTarget.id]), inline: true }
    )
    .setTimestamp();

  await pointsLog.send({ embeds: [logEmbed] }).catch(() => {});
}

await message.reply(
  `تم تعديل نقاط ${pointsTarget} بمقدار ${change > 0 ? '+' : ''}${change}. المجموع الآن: ${points[pointsTarget.id]}`
).catch(() => {});
  
  return;
}
  if (message.content.trim() === '!نشرالقوانين') {
  if (message.channel.id !== '1556019029011992706') return;

  const allowedRoles = [
    '1560413851248496730',
    '1556053314120978462',
    '1556059028528963674'
  ];

  if (!message.member.roles.cache.some(role => allowedRoles.includes(role.id))) return;

  const rulesEmbed = new EmbedBuilder()
    .setColor(0x301b36)
    .setTitle('قوانين مجتمعنا')
    .setDescription([
      '1. الاحترام واجب بين جميع الأعضاء',
      '2. يمنع السب والشتم والإساءة لأي عضو',
      '3. يمنع نشر أو طلب أي محتوى غير مناسب',
      '4. يمنع نشر الروابط أو الإعلانات بدون إذن الإدارة',
      '5. يمنع التمييز أو العنصرية أو إثارة المشاكل',
      '6. يمنع إزعاج الأعضاء بالمنشنات المتكررة',
      '7. يمنع انتحال شخصية أي عضو أو إداري',
      '8. يمنع استغلال الثغرات أو محاولة تخريب السيرفر',
      '9. يمنع إثارة المشاكل أو افتعال النزاعات داخل الكوميونتي',
      '10. يجب الالتزام بتعليمات الإدارة والمشرفين',
      '11. يمنع استخدام الحسابات البديلة للتحايل على العقوبات',
      '12. يمنع نشر معلومات شخصية عن أي شخص بدون موافقته',
      '13. يمنع السبام وتكرار الرسائل بشكل مزعج',
      '14. يمنع استغلال قنوات الكوميونتي لغير الغرض المخصص لها',
      '15. مخالفة القوانين تعرض صاحبها للعقوبة حسب تقدير الإدارة'
    ].join('\n'))
    .setImage('https://cdn.discordapp.com/attachments/1565225532050767922/1566793112519450754/FS_banner_blue_original_animation.gif?ex=6ae9d54b&is=6ae883cb&hm=6fee1f51b4e32f88971201bbc8d49dff339111534296e37772c64892d288f4ca');

  await message.channel.send({ embeds: [rulesEmbed] });
  await message.delete().catch(() => {});
  return;
}
  const lineRoomId = '1562747416745218169';

if (message.channel.id === lineRoomId) {
  await message.channel.send('https://cdn.discordapp.com/attachments/1565225532050767922/1566793112519450754/FS_banner_blue_original_animation.gif?ex=6ae9d54b&is=6ae883cb&hm=6fee1f51b4e32f88971201bbc8d49dff339111534296e37772c64892d288f4ca');

  if (message.content.trim() === '!خط') {
    await message.delete().catch(() => {});
    return;
  }
}
  const found = config.autoReplies.find(x => message.content.toLowerCase().includes(x.trigger.toLowerCase()));
  const eventMessages = {
  'بدايه فعاليات':
    '<@&1556295463987318905>\n# 🎉 بدت فعالياتنا لهذا اليوم الجميل 🎉',
  'نهايه فعاليات':
    '<@&1556295463987318905>\n# انتهت فعالياتنا لهذا اليوم\nلا تنسو تصلو على النبي 🖤'
};

const eventMessage = eventMessages[message.content.trim()];

if (eventMessage) {
  const allowedRoles = ['1560413851248496730', '1556053314120978462', '1556059028528963674'];
if (!message.member.roles.cache.some(role => allowedRoles.includes(role.id))) return;
  await message.channel.send({
    content: eventMessage,
    allowedMentions: { roles: ['1556295463987318905'] }
  });
  await message.delete().catch(() => {});
  return;
}
if (found) {
  if (message.content.trim() === '!خط') {
    await message.channel.send(found.response);
    await message.delete().catch(() => {});
  } else {
    await message.reply(found.response).catch(() => {});
  }
}});
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (!oldMember.premiumSince && newMember.premiumSince) {
    const room = await newMember.guild.channels
      .fetch('1556019948361351168')
      .catch(() => null);

    if (room) {
      await room.send(
        `شكرًا جزيلًا على دعمك لسيرفرنا بالبوست، بوجودك نكبر العائلة\n\n✦ <@${newMember.id}> ✦`
      );
    }
  }
});
async function sendMemberLog(guild, title, description, color, member = null) {
  const channel = await guild.channels
    .fetch('1556057724540682370')
    .catch(() => null);

  if (!channel?.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
if (member) {
  embed.setThumbnail(member.displayAvatarURL({ extension: 'png', size: 256 }));
}
  await channel.send({ embeds: [embed] }).catch(() => {});
}

client.on(Events.GuildMemberAdd, async member => {
  await sendMemberLog(
    member.guild,
    'دخل عضو جديد',
    `العضو: ${member.user.tag}\nالمعرّف: ${member.id}`,
  0x57f287,
member
    
  );
});

client.on(Events.GuildMemberRemove, async member => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const logs = await member.guild.fetchAuditLogs({ limit: 10 }).catch(() => null);

  const entry = logs?.entries.find(item =>
    [AuditLogEvent.MemberKick, AuditLogEvent.MemberBanAdd].includes(item.action) &&
    item.target?.id === member.id &&
    Date.now() - item.createdTimestamp < 15000
  );

  const action = !entry
    ? 'غادر السيرفر'
    : entry.action === AuditLogEvent.MemberBanAdd
      ? 'تم حظره'
      : 'تم طرده';

  const executor = entry?.executor
    ? `\nبواسطة: ${entry.executor.tag}`
    : '';

  await sendMemberLog(
    member.guild,
    action,
    `العضو: ${member.user.tag}\nالمعرّف: ${member.id}${executor}`,
    entry ? 0xed4245 : 0x5865f2,
member
  );
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  const addedRoles = newMember.roles.cache.filter(role =>
    !oldMember.roles.cache.has(role.id)
  );

  const removedRoles = oldMember.roles.cache.filter(role =>
    !newMember.roles.cache.has(role.id)
  );

  if (!addedRoles.size && !removedRoles.size) return;

  await new Promise(resolve => setTimeout(resolve, 1000));

  const logs = await newMember.guild.fetchAuditLogs({
    type: AuditLogEvent.MemberRoleUpdate,
    limit: 10
  }).catch(() => null);

  const entry = logs?.entries.find(item =>
    item.target?.id === newMember.id &&
    Date.now() - item.createdTimestamp < 15000
  );

  const executor = entry?.executor?.tag || 'غير معروف';

  for (const role of addedRoles.values()) {
    await sendMemberLog(
      newMember.guild,
      'تمت إضافة رتبة',
      `العضو: ${newMember.user.tag}\nأضافها: ${executor}\nالرتبة: ${role.name}`,
      0x57f287
    );
  }

  for (const role of removedRoles.values()) {
    await sendMemberLog(
      newMember.guild,
      'تمت إزالة رتبة',
      `العضو: ${newMember.user.tag}\nأزالها: ${executor}\nالرتبة: ${role.name}`,
      0xed4245
    );
  }
});
const pendingBans = new Map();

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.trim().startsWith('+تف')) return;

  const allowedBanRoles = [
    '1559303642572656670', // Senior Admin
    '1559304253623894036', // Head Admin
    '1560413851248496730', // High Staff
    '1559304879766372503', // Supervisor
    '1559305739124871208', // Management
    '1559305518831636562', // Head Management
    '1559306398976966696', // Co Founder
    '1559306596952055828', // Founder
    '1565053414331777174', // Developer
    '1556053729193762907', // Co Owner
    '1556027456584945685', // Owner
    '1556315045582086354'  // The King of the Server
  ];

  if (!message.member.roles.cache.some(role => allowedBanRoles.includes(role.id))) {
    await message.reply('ما عندك صلاحية تستخدم أمر الحظر.');
    return;
  }

  const match = message.content.match(/^\+تف\s+<@!?\d+>\s*(.*)$/s);
  const target = message.mentions.members.first();

  if (!match || !target) {
    await message.reply('استخدم الأمر هكذا: `+تف @العضو السبب` — والسبب اختياري.');
    return;
  }

  if (target.id === message.author.id) {
    await message.reply('ما تقدر تحظر نفسك.');
    return;
  }

  const reason = match[1].trim() || 'لم يُذكر سبب';
  const requestId = `${message.author.id}_${Date.now()}`;

  pendingBans.set(requestId, {
    guildId: message.guild.id,
    targetId: target.id,
    executorId: message.author.id,
    reason
  });

  const banEmbed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('هل تود في استخدام السلاح المحرم دوليا؟')
    .setDescription(`**العضو:** ${target.user.tag}\n**السبب:** ${reason}`)
    .setImage('https://static2.klipy.com/ii/935d7ab9d8c6202580a668421940ec81/fa/91/9nZRxdF2.gif');

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ban_confirm:${requestId}`)
      .setLabel('تأكيد الحظر')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`ban_cancel:${requestId}`)
      .setLabel('إلغاء')
      .setStyle(ButtonStyle.Secondary)
  );

  await message.channel.send({ embeds: [banEmbed], components: [buttons] });
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const isConfirm = interaction.customId.startsWith('ban_confirm:');
  const isCancel = interaction.customId.startsWith('ban_cancel:');
  if (!isConfirm && !isCancel) return;

  const requestId = interaction.customId.split(':')[1];
  const pending = pendingBans.get(requestId);

  if (!pending) {
    await interaction.reply({
      content: 'انتهت صلاحية هذا الطلب. أرسل الأمر مرة ثانية.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.user.id !== pending.executorId) {
    await interaction.reply({
      content: 'فقط الشخص الذي بدأ طلب الحظر يقدر يؤكد أو يلغي.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  pendingBans.delete(requestId);

  if (isCancel) {
    await interaction.update({
      content: 'تم إلغاء طلب الحظر.',
      embeds: [],
      components: []
    });
    return;
  }

  const guild = interaction.guild;
  const target = await guild.members.fetch(pending.targetId).catch(() => null);

  if (!target) {
    await interaction.update({
      content: 'ما قدرت ألقى العضو في السيرفر.',
      embeds: [],
      components: []
    });
    return;
  }

  try {
    await guild.members.ban(target.id, { reason: pending.reason });

    const successEmbed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('تم حظر العضو')
      .setDescription(`**العضو:** ${target.user.tag}\n**بواسطة:** ${interaction.user.tag}\n**السبب:** ${pending.reason}`)
      .setImage('https://static2.klipy.com/ii/935d7ab9d8c6202580a668421940ec81/fa/91/9nZRxdF2.gif');

    await interaction.update({ embeds: [successEmbed], components: [] });
  } catch (error) {
    console.error('Ban error:', error);
    await interaction.update({
      content: 'فشل الحظر. تأكد أن رتبة البوت أعلى من رتبة العضو.',
      embeds: [],
      components: []
    });
  }
});
client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.trim().startsWith('+ارجع')) return;

  const allowedRoles = [
    '1559303642572656670',
    '1559304253623894036',
    '1560413851248496730',
    '1559304879766372503',
    '1559305739124871208',
    '1559305518831636562',
    '1559306398976966696',
    '1559306596952055828',
    '1565053414331777174',
    '1556053729193762907',
    '1556027456584945685',
    '1556315045582086354'
  ];

  if (!message.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
    await message.reply('ما عندك صلاحية تستخدم أمر فك الحظر.');
    return;
  }

  const match = message.content.trim().match(/^\+ارجع\s+(?:<@!?(\d+)>|(\d+))$/);
  const userId = match?.[1] || match?.[2];

  if (!userId) {
    await message.reply('استخدم الأمر هكذا: `+ارجع آيدي_العضو`');
    return;
  }

  try {
    const unbannedUser = await message.guild.bans.remove(
      userId,
      `فك الحظر بواسطة ${message.author.tag}`
    );

    await message.reply(`تم فك الحظر عن **${unbannedUser.tag}**.`);
  } catch (error) {
    console.error('Unban error:', error);
    await message.reply('ما قدرت أفك الحظر. تأكد من الآيدي وأن العضو محظور.');
  }
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
client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim();
  const isEventQuery = content === '+استعلام ايفنت';
  const isEventAdd = content.startsWith('+ايفنت');

  if (!isEventQuery && !isEventAdd) return;

  const allowedChannels = [
    '1567593935373598770',
    '1565213564640296960'
  ];

  if (!allowedChannels.includes(message.channel.id)) {
    await message.reply('استخدم نظام نقاط الإيفنت في روم أوامر الإيفنت أو روم التجارب.');
    return;
  }

  if (isEventQuery) {
    const rows = Object.entries(getEventPoints())
      .filter(([, total]) => total > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([id, total], index) => `**${index + 1}.** <@${id}> — **${total}** نقطة`);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('نقاط فريق الفعاليات')
      .setDescription(rows.join('\n').slice(0, 4000) || 'ما في أعضاء معهم نقاط حاليًا.');

    await message.channel.send({ embeds: [embed] });
    return;
  }

  const allowedRoles = [
    '1559303642572656670',
    '1559304253623894036',
    '1560413851248496730',
    '1559304879766372503',
    '1559305739124871208',
    '1559305518831636562',
    '1559306398976966696',
    '1559306596952055828',
    '1565053414331777174',
    '1556053729193762907',
    '1556027456584945685',
    '1556315045582086354'
  ];

  if (!message.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
    await message.reply('ما عندك صلاحية تضيف نقاط الإيفنت.');
    return;
  }

  const target = message.mentions.members.first();
  const match = content.match(/^\+ايفنت\s+<@!?\d+>\s+([+-])(\d+)$/);

  if (!target || !match) {
    await message.reply('استخدم الأمر هكذا: `+ايفنت @العضو +50` أو `+ايفنت @العضو -20`');
    return;
  }

  const eventTeamRoles = [
    '1567569828888187065',
    '1567570219096997888',
    '1567570806022606939',
    '1567571282218844190',
    '1567571710700425226',
    '1567573779369173112',
    '1567574121154351304'
  ];

  if (!target.roles.cache.some(role => eventTeamRoles.includes(role.id))) {
    await message.reply('تقدر تضيف النقاط لأعضاء فريق الفعاليات فقط.');
    return;
  }

const amount = Number(match[2]);
const change = match[1] === '+' ? amount : -amount;
const points = getEventPoints();

points[target.id] = Math.max(0, (points[target.id] || 0) + change);
saveEventPoints(points);

const eventRankLevels = [
  { points: 0, id: '1567569828888187065', name: 'Event Trainee' },
  { points: 20, id: '1567570219096997888', name: 'Event Member' },
  { points: 50, id: '1567570806022606939', name: 'Event Organizer' },
  { points: 90, id: '1567571282218844190', name: 'Senior Organizer' },
  { points: 140, id: '1567571710700425226', name: 'Event Supervisor' },
  { points: 200, id: '1567573779369173112', name: 'Event Manager' },
  { points: 280, id: '1567574121154351304', name: 'Head of Events' }
];

const ranksToAdd = eventRankLevels.filter(rank =>
  points[target.id] >= rank.points && !target.roles.cache.has(rank.id)
);

const ranksToRemove = eventRankLevels.filter(rank =>
  points[target.id] < rank.points && target.roles.cache.has(rank.id)
);

let rankNotice = '';

try {
  if (ranksToAdd.length) {
    await target.roles.add(ranksToAdd.map(rank => rank.id));
    const highestRank = ranksToAdd[ranksToAdd.length - 1];
    rankNotice += `\n🎉 مبروك ${target}، ترقيت إلى **${highestRank.name}** ❤️❤️`;
  }

  if (ranksToRemove.length) {
    await target.roles.remove(ranksToRemove.map(rank => rank.id));
    const highestRemovedRank = ranksToRemove[ranksToRemove.length - 1];
    rankNotice += `\nتم سحب رتبة **${highestRemovedRank.name}** بسبب انخفاض النقاط.`;
  }
} catch (error) {
  console.error('Event rank update error:', error);
  rankNotice += '\nتعذر تعديل الرتبة؛ تأكد أن رتبة البوت أعلى من رتب الإيفنت.';
}

await message.reply(
  `تم تعديل نقاط ${target} بمقدار **${change > 0 ? '+' : ''}${change}**. المجموع الآن: **${points[target.id]}**.${rankNotice}`
);
});
if (!process.env.DISCORD_TOKEN) throw new Error('ضع DISCORD_TOKEN داخل ملف .env');
client.login(process.env.DISCORD_TOKEN);
