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
		.setName('tracksr')
		.setDescription('Start track your rank and stats !')
        .addStringOption(option =>
			option
				.setName('user')
				.setDescription('The user you are looking for')
				.setRequired(true)),
	async execute(interaction) {
        const userInput = interaction.options.getString('user');
        var title = `🔎 ${userInput} 🔍`;

        const OverwatchSR = model('OverwatchSR.users', OverwatchSRSchema);
        
        const users = OverwatchSR.find({}, async function(err, users) {
            if (err) throw err;
            userNames = [];
            users.forEach(user => {
                userNames.push(user.name);
            });
            if (userNames.includes(userInput)) {
                // get the user from db
                const user = OverwatchSR.find({name: userInput}, async function(err, users) {
                    if (err) throw err;
                    users.forEach(async user => {
                        // get the user rank
                        const rank = user.rank;
                        // get the user win
                        const win = user.win;
                        // get the user draw
                        const draw = user.draw;
                        // get the user loose
                        const loose = user.loose;
                        // get the user total
                        const total = win + draw + loose;
                        // create the embed message
                        const embed = createEmbed(userInput, rank, win, draw, loose);
                        const buttons = createButton();
                        // send the embed message
                        await interaction.reply({ embeds: [embed] , components: [buttons] });
                    }
                    );
                }
                );
            }
            else {
                // tell user that user not exist in db and delete after few seconds
                await interaction.reply(`User not in database, to add one --> /adduser ${userInput}`);
            }
        });
	},
};


// create the funtion that create an embed message with parameters (user, rank, win, draw, loose)
function createEmbed(user, rank, win, draw, loose) {
    // get the total games
    const totalGames = win + loose + draw;
    // get the winrate
    const winrate = Math.round((win / totalGames) * 100);

    const trackerEmbed = new EmbedBuilder()
        .setColor('#fc5203')
        .setTitle(`🔎 ${user} 🔍`)
        .setAuthor({ name: 'OW2 Rank tracker', iconURL: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7', url: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7' })
        // add fields for rank, win, draw and loose
        .addFields(
            { name: 'Rank', value: `${rank}`, inline: false },
            { name: 'Win', value: `${win}`, inline: true },
            { name: 'Draw', value: `${draw}`, inline: true },
            { name: 'Loose', value: `${loose}`, inline: true },
            { name: 'Winrate', value: `${winrate}%`, inline: false },
        )
        .setFooter({ text: 'made by @Sh0wny#3549', iconURL: 'https://cdn.discordapp.com/avatars/176945428955267073/37cd59ed3485910a859f4c5114d8eed0.png?size=1024' });
    return trackerEmbed;
}

function createButton() {
    const buttons = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('win')
            .setLabel('Win')
            .setStyle('Success'),
        new ButtonBuilder()
            .setCustomId('draw')
            .setLabel('Draw')
            .setStyle('Secondary'),
        new ButtonBuilder()
            .setCustomId('loose')
            .setLabel('Loose')
            .setStyle('Danger'),
        new ButtonBuilder()
            .setCustomId('uprank')
            .setLabel('UpRank')
            .setStyle('Primary')
            .setEmoji('🏆'),
        new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle('Primary')
            .setDisabled(true)
            .setEmoji('🪄')
    );
    return buttons;
}