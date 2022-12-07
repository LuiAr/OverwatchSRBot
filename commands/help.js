const { SlashCommandBuilder , EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Know more informations about the commands.'),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		const helpEmbed = new EmbedBuilder()
        .setColor('#fc5203')
        .setTitle(`🔎 Help 🔍`)
        .setAuthor({ name: 'OW2 Rank tracker', iconURL: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7', url: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7' })        .addFields(
            { name: 'Commands', value: '```!tracksr PSEUDO``` ```!invite``` ```!adduser``` ```!historic```', inline: true },
            { name: 'Example', value: '```!tracksr Sh0wny``` ```Add the bot to your server !``` ```Start track your stats !``` ```!historic Sh0wny```', inline: true },
        )
        .setFooter({ text: 'made by @Sh0wny#3549', iconURL: 'https://cdn.discordapp.com/avatars/176945428955267073/37cd59ed3485910a859f4c5114d8eed0.png?size=1024' });
		await interaction.reply({ embeds: [helpEmbed]});
	},
};