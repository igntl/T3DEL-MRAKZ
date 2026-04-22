const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionsBitField 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const CHANNEL_ID = "1496550321193881702";

const cooldown = new Map();
const COOLDOWN = 2 * 60 * 1000;

const validPositions = [
  "ST","RF","CF","RLF","LRF",
  "CM","RCM","LCM","CDM",
  "CB","LCB","RCB",
  "LB","RB","LRB","RLB",
  "GK"
];

const map = {
  RCM: "CM",
  LCM: "CM",
  RCB: "CB",
  LCB: "CB",
  RLF: "RF",
  LRF: "RF"
};

client.on('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// نشر الزر
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== CHANNEL_ID) return;

  if (message.content.toLowerCase() === "!button") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    message.delete().catch(() => {});

    const button = new ButtonBuilder()
      .setCustomId('fix_name')
      .setLabel('تعديل مركزي')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    message.channel.send({
      content: "اضغط الزر لتعديل اسمك تلقائيًا",
      components: [row]
    });
  }
});

// الزر
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== 'fix_name') return;

  const userId = interaction.user.id;
  const now = Date.now();

  // كولداون
  if (cooldown.has(userId)) {
    const time = cooldown.get(userId) + COOLDOWN;

    if (now < time) {
      const left = Math.ceil((time - now) / 1000);
      return interaction.reply({
        content: `⏳ انتظر ${left} ثانية`,
        ephemeral: true
      });
    }
  }

  cooldown.set(userId, now);

  const member = interaction.member;
  const botMember = interaction.guild.members.me;

  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
    return interaction.reply({
      content: "❌ ما عندي صلاحية",
      ephemeral: true
    });
  }

  let original = member.nickname || member.user.username;

  // نحذف فقط | من النسخة المؤقتة
  let cleanForScan = original.replace(/\|/g, "");

  let words = cleanForScan.split(/\s+/);

  let positions = [];

  for (let word of words) {
    let clean = word.toUpperCase().replace(/[^A-Z]/g, '');

    if (validPositions.includes(clean)) {
      let mapped = map[clean] || clean;
      positions.push(mapped);
    }
  }

  // حذف التكرار + أول مركزين
  positions = [...new Set(positions)].slice(0, 2);

  if (positions.length === 0) {
    return interaction.reply({
      content: "❌ ما لقيت مراكز في اسمك",
      ephemeral: true
    });
  }

  // ✨ هنا السر:
  // نحذف المراكز من الاسم بدون ما نخربه
  let finalName = original;

  for (let pos of validPositions) {
    const regex = new RegExp(`\\b${pos}\\b`, 'gi');
    finalName = finalName.replace(regex, '');
  }

  finalName = finalName.replace(/\|/g, '').replace(/\s+/g, ' ').trim();

  let newName = `${positions.join(" ")} | ${finalName}`;

  try {
    await member.setNickname(newName);

    await interaction.reply({
      content: "✅ تم تعديل اسمك",
      ephemeral: true
    });

  } catch {
    await interaction.reply({
      content: "❌ ما قدرت أغير اسمك",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
