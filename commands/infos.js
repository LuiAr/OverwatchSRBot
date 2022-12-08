const { SlashCommandBuilder , EmbedBuilder } = require('discord.js');

// MONGO
const {connect , Schema, model} = require('mongoose');

// create OverwatchSRSchema
const OverwatchSRSchema = new Schema({
    name: String,
    rank: String,
    win: Number,
    draw: Number,
    loose: Number,
});

const OverwatchSRHistoric = new Schema({
    name: String,
    historic: [{
        oldRank: String,
        newRank: String,
        date: Date,
        win: Number,
        draw: Number,
        loose: Number,
    }],
});

new Schema (
    { url: String, text: String, id: Number}, 
    { collection : 'OverwatchSR' }
);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('infos')
		.setDescription('Know infos of a user')
        .addStringOption(option =>
			option
				.setName('user')
				.setDescription('The user you are looking for')
				.setRequired(true)),
	async execute(interaction) {
		const OverwatchSR = model('OverwatchSR.users', OverwatchSRSchema);
		const userArg = interaction.options.getString('user');

        OverwatchSR.find({}, async function(err, users) {
            if (err) throw err;
            userNames = [];
            users.forEach(user => {
                userNames.push(user.name);
            });
            console.log(userNames);
            if (userNames.includes(userArg)) {
                OverwatchSR.find({name: userArg}, async function(err, users) {
                    if (err) throw err;
                    const user = users[0];
                    // create embed
                    const infosEmbed = new EmbedBuilder()
                    .setColor('#fc5203')
                    .setTitle(`🔎 Infos for user: ${user.name} 🔍`)
                    .setAuthor({ name: 'OW2 Rank tracker', iconURL: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7', url: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7' })
                    .addFields(
                        { name: 'Rank', value: `${user.rank}`, inline: false },
                        { name: 'Win', value: `${user.win}`, inline: false },
                        { name: 'Draw', value: `${user.draw}`, inline: false },
                        { name: 'Loose', value: `${user.loose}`, inline: false },
                    )
                    .setFooter({ text: 'made by @Sh0wny#3549', iconURL: 'https://cdn.discordapp.com/avatars/176945428955267073/37cd59ed3485910a859f4c5114d8eed0.png?size=1024' });
                    await interaction.reply({ embeds: [infosEmbed]});
                });
            }
            else {
                await interaction.reply("User doesn't exists");
            }
        });
	},
};


