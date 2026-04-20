const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔒 حدد الروم هنا مباشرة
const ALLOWED_CHANNEL_ID = "1483219896069525665";

// 📌 قائمة المراكز
const validPositions = [
  "ST","RF","CF",
  "CM","RCM","LCM","CDM",
  "CB","LCB","RCB",
  "LB","RB","LRB","RLB",
  "GK"
];

// 🔄 التحويل
const positionMap = {
  RCM: "CM",
  LCM: "CM",
  RCB: "CB",
  LCB: "CB"
};

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // ❌ يشتغل فقط في الروم المحدد
  if (message.channel.id !== ALLOWED_CHANNEL_ID) return;

  if (message.content.toLowerCase() === "!pos") {

    // 🧼 حذف الأمر
    message.delete().catch(() => {});

    const member = message.member;
    const botMember = message.guild.members.me;

    // 🔐 تأكد من صلاحيات البوت
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
      const msg = await message.channel.send("❌ البوت ما عنده صلاحية تغيير الأسماء");
      return setTimeout(() => msg.delete(), 3000);
    }

    // 📌 اسم اللاعب الحالي
    let nickname = member.nickname || member.user.username;

    let words = nickname.split(/\s+/);

    let positions = [];
    let nameParts = [];

    for (let word of words) {
      let upper = word.toUpperCase();

      if (validPositions.includes(upper)) {
        let mapped = positionMap[upper] || upper;
        positions.push(mapped);
      } else {
        nameParts.push(word);
      }
    }

    // حذف التكرار
    positions = [...new Set(positions)];

    // ❌ إذا ما فيه مراكز
    if (positions.length === 0) {
      const msg = await message.channel.send("❌ ما لقيت مراكز في اسمك");
      return setTimeout(() => msg.delete(), 3000);
    }

    // 📌 الاسم بدون تغيير
    let finalName = nameParts.join(" ").trim();

    // 🧠 النتيجة النهائية
    let newNickname = `${positions.join(" ")} | ${finalName}`;

    try {
      await member.setNickname(newNickname);

      const msg = await message.channel.send("✅ تم تعديل اسمك");
      setTimeout(() => msg.delete(), 2000);

    } catch (err) {
      const msg = await message.channel.send("❌ ما قدرت أغير اسمك (يمكن رتبتك أعلى مني)");
      setTimeout(() => msg.delete(), 3000);
    }
  }
});

client.login(process.env.TOKEN);
