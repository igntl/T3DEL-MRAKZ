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

// 🔒 الروم
const CHANNEL_ID = "1483219896069525665";

// ⏱️ كولداون (دقيقتين)
const cooldown = new Map();
const COOLDOWN = 2 * 60 * 1000;

// 📌 المراكز
const validPositions = [
  "ST","RF","CF","RLF","LRF",
  "CM","RCM","LCM","CDM",
  "CB","LCB","RCB",
  "LB","RB","LRB","RLB",
  "GK"
];

// 🔄 تحويل المراكز
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

// 📩 أمر نشر الزر
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.channel.id !== CHANNEL_ID) return;

  if (message.content.toLowerCase() === "!button") {

    // 🔒 للأدمن فقط
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

// 🎮 زر
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'fix_name') {

    const userId = interaction.user.id;
    const now = Date.now();

    // ⛔ كولداون
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

    let nickname = member.nickname || member.user.username;

    // 🧹 حذف أي |
    nickname = nickname.replace(/\|/g, "");

    let words = nickname.split(/\s+/);

    let positions = [];
    let nameParts = [];

    for (let word of words) {
      let upper = word.toUpperCase();

      if (validPositions.includes(upper)) {
        let mapped = map[upper] || upper;
        positions.push(mapped);
      } else {
        nameParts.push(word);
      }
    }

    // 🔥 حذف التكرار + أول مركزين فقط
    positions = [...new Set(positions)].slice(0, 2);

    if (positions.length === 0) {
      return interaction.reply({
        content: "❌ ما لقيت مراكز في اسمك",
        ephemeral: true
      });
    }

    let finalName = nameParts.join(" ").trim();

    let newName = `${positions.join(" ")} | ${finalName}`;

    try {
      await member.setNickname(newName);

      await interaction.reply({
        content: "✅ تم تعديل اسمك",
        ephemeral: true
      });

    } catch {
      await interaction.reply({
        content: "❌ ما قدرت أغير اسمك (يمكن رتبتك أعلى مني)",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
