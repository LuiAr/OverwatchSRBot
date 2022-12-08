const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Clear x messages in the chat (max = 100).')
		.addIntegerOption(option =>
			option
				.setName('nbr')
				.setDescription('The number of messages to delete (max = 100)')
				.setRequired(true)),
	async execute(interaction) {
		const nbrToDelete = interaction.options.getInteger('nbr');
		if (nbrToDelete > 100) {
			await interaction.reply(`Cannot delete more than 100 messages !`);
		} else {
			interaction.channel.bulkDelete(nbrToDelete);
			await interaction.reply(`Cleared ${nbrToDelete} messages !`);
		}
	},
};