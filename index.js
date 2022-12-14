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

// DISCORD JS

// For commands handling
const fs = require('node:fs');
const path = require('node:path');

const { Client, Collection, GatewayIntentBits , Events , EmbedBuilder , PermissionsBitField , Permissions, MessageEmbed, ActionRowBuilder, ButtonBuilder, ButtonStyle ,ModalBuilder,TextInputBuilder, TextInputStyle , AttachmentBuilder  } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds , GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const prefix = '!';

// For events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// For commands
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


client.on("messageCreate" , (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLocaleLowerCase();

    // message array

    const messageArray = message.content.split(" ");
    const argument = messageArray.slice(1);
    const cmd = messageArray[0];
    

    // Commands

    // Command show historic
    if (command === "historic") {
        // if no args return and send a message
        if (!args[0]) return message.reply("Please specify the user !");

        new Schema (
            { url: String, text: String, id: Number}, 
            { collection : 'OverwatchSR' }
        );

        //TODO CHECK IF USER IN DB
        const OverwatchSR = model('OverwatchSR.users', OverwatchSRSchema);
        OverwatchSR.find({}, function(err, users) {
            if (err) throw err;
            var userNames = [];
            users.forEach(user => {
                userNames.push(user.name);
            });
            console.log("USERS IN DB: ",userNames);
            if (userNames.includes(args[0])) {
                const userName = args[0];
                //? create the model
                const OwHistoModel = model('OverwatchSR.historic', OverwatchSRHistoric);
                OwHistoModel.find({name: userName}, function(err, users) {
                    if (err) throw err;
                    const user = users[0];

                    //? If no historic reply 
                    if (user.historic.length == 0) {
                        message.reply("No historic for this user");
                    }
                    else {
                        const historicEmbed = new EmbedBuilder()
                        .setColor('#fc5203')
                        .setTitle(`???? Historic ${user.name} | P. 1 ????`)
                        .setAuthor({ name: 'OW2 Rank tracker', iconURL: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7', url: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7' })
                        .setThumbnail('https://toppng.com/public/uploads/thumbnail/browser-history-clock-icon-vector-white-11562914072gh3hheazcj.png')
                        .addFields(
                            { name: 'Rank update          ', value: `*${user.historic[0].oldRank}*  -->  *${user.historic[0].newRank}*
                                **Win**: ${user.historic[0].win}
                                **Draw**: ${user.historic[0].draw}
                                **Loose**: ${user.historic[0].loose}
                                **Date**: ${user.historic[0].date.getDate()}/${user.historic[0].date.getMonth()}/${user.historic[0].date.getFullYear()}`, inline: true }
                        )
                        .setFooter({ text: 'made by @Sh0wny#3549', iconURL: 'https://cdn.discordapp.com/avatars/176945428955267073/37cd59ed3485910a859f4c5114d8eed0.png?size=1024' });
                        
                        // Get the buttons
                        const historicButtons = getHistoricButtons();

                        //? Send the embed
                        message.delete();
                        message.channel.send({ embeds: [historicEmbed], components: [historicButtons]});
                    }
                });
            }
            else {
                message.reply("User not exists. To add: `!adduser NAME`");
            }
        });
        
    }

    // add user to db command
    if (command === "adduser") {
        // if no args return and send a message
        if (!args[0]) return message.reply("Please specify the user name !");

        new Schema (
            { url: String, text: String, id: Number},
            { collection : 'OverwatchSR' });

        const OverwatchSR = model('OverwatchSR.users', OverwatchSRSchema);

        // create a new user with args
        const newUser = new OverwatchSR({
            name: args[0],
            rank: "Unranked",
            win: 0,
            draw: 0,
            loose: 0,
        });

        OverwatchSR.find({}, function(err, users) {
            if (err) throw err;
            userNames = [];
            users.forEach(user => {
                userNames.push(user.name);
            });
            if (userNames.includes(args[0])) {
                message.reply("This user already exist");
            }
            else {
                newUser.save(function(err) {
                    if (err) throw err;
                    message.reply("User created");
                });
            }
        });

        // Now add the historic for this user
        new Schema (
            { url: String, text: String, id: Number}, 
            { collection : 'OverwatchSR' }
        );
    
        const OwHistoric = model('OverwatchSR.historic', OverwatchSRHistoric);
    
        // create a new user with args
        const newHistoric = new OwHistoric({
            name: args[0],
            historic: [],
        });

        OwHistoric.find({}, function(err, users) {
            if (err) throw err;
            userNames = [];
            users.forEach(user => {
                userNames.push(user.name);
            });
            if (userNames.includes(args[0])) {
            }
            else {
                newHistoric.save(function(err) {
                    if (err) throw err;
                });
            }
        }
        );


    }
 
    // RANK TRACKER
    if (command === "tracksr") {
        // delete the command message
        message.delete();

        // if no args return and send a message
        if (!args[0]) return message.reply("Please specify the user !");

        // get the user name 
        const userInput = args[0];

        // Title
        var title = `???? ${userInput} ????`;

        // get users from db
        new Schema (
            { url: String, text: String, id: Number},
            { collection : 'OverwatchSR' });

        const OverwatchSR = model('OverwatchSR.users', OverwatchSRSchema);

        // get all users
        const users = OverwatchSR.find({}, function(err, users) {
            if (err) throw err;
            userNames = [];
            users.forEach(user => {
                userNames.push(user.name);
            });
            if (userNames.includes(userInput)) {
                // get the user from db
                const user = OverwatchSR.find({name: userInput}, function(err, users) {
                    if (err) throw err;
                    users.forEach(user => {
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
                        // get the user winrate
                        const winrate = Math.round((win / total) * 100);
                        // create the embed message
                        const embed = createEmbed(userInput, rank, win, draw, loose);
                        const buttons = createButton();
                        // send the embed message
                        message.channel.send({ embeds: [embed] , components: [buttons] });
                    }
                    );
                }
                );
            }
            else {
                // tell user that user not exist in db and delete after few seconds
                message.channel.send(`User not in database, to add one --> !adduser ${userInput}`).then(msg => {
                    setTimeout(() => msg.delete(), 5000)
                }
                );
            }
        });
    }
    
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    //! HISTORIC NEXT PAGE
    if (interaction.customId === 'historicNext') {
        // get the user name from title: "???? Historic: ${user.name} | P. 1 ????"
        const title = interaction.message.embeds[0].title;
        const userName = title.split(" ")[2];
        // get the page number from title: "???? Historic: ${user.name} | P. 1 ????"
        const pageNumber = title.split(" ")[5];
        // get the user from db
        new Schema (
            { url: String, text: String, id: Number},
            { collection : 'OverwatchSR' });

        const OwHistoModel = model('OverwatchSR.historics', OverwatchSRHistoric);
        const user = OwHistoModel.find({name: userName}, function(err, users) {
            if (err) throw err;
            users.forEach(user => {
                // get the user historic
                const historic = user.historic;
                // convert pagenumber from string to int
                const pageNumberInt = parseInt(pageNumber);
                // get the user historic length
                const historicLength = historic.length;

                if (pageNumberInt < historicLength) {
                    const historicPage = historic[pageNumber];
                    const newPageNumber = pageNumberInt + 1;

                    // create the embed message
                    const historicEmbed = new EmbedBuilder()
                    .setColor('#fc5203')
                    .setTitle(`???? Historic ${user.name} | P. ${newPageNumber} ????`)
                    .setAuthor({ name: 'OW2 Rank tracker', iconURL: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7', url: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7' })
                    .setThumbnail('https://toppng.com/public/uploads/thumbnail/browser-history-clock-icon-vector-white-11562914072gh3hheazcj.png')
                    .addFields(
                        { name: 'Rank update          ', value: `*${user.historic[pageNumber].oldRank}*  -->  *${user.historic[pageNumber].newRank}*
                            **Win**: ${user.historic[pageNumber].win}
                            **Draw**: ${user.historic[pageNumber].draw}
                            **Loose**: ${user.historic[pageNumber].loose}
                            **Date**: ${user.historic[pageNumber].date.getDate()}/${user.historic[pageNumber].date.getMonth()}/${user.historic[pageNumber].date.getFullYear()}`, inline: true }
                    )
                    .setFooter({ text: 'made by @Sh0wny#3549', iconURL: 'https://cdn.discordapp.com/avatars/176945428955267073/37cd59ed3485910a859f4c5114d8eed0.png?size=1024' });

                    // Get the buttons
                    const historicButtons = getHistoricButtons();

                    // send the embed message
                    interaction.message.edit({ embeds: [historicEmbed] , components: [historicButtons] });
                    // end the interaction
                    // interaction.reply({ content: `Showing page ${newPageNumber}/${historicLength}`, ephemeral: true });     
                    interaction.deferUpdate();
                }
                else {
                    //? tell user that user not exist in db and delete after few seconds
                    interaction.reply({ content: 'No more historic to show', ephemeral: true });
                }
            });
        });
    }

    //! HISTORIC PREVIOUS PAGE
    if (interaction.customId === 'historicPrev') {
        const title = interaction.message.embeds[0].title;
        const userName = title.split(" ")[2];
        const pageNumber = title.split(" ")[5];
        // get the user from db
        new Schema (
            { url: String, text: String, id: Number},
            { collection : 'OverwatchSR' });

        const OwHistoModel = model('OverwatchSR.historics', OverwatchSRHistoric);
        const user = OwHistoModel.find({name: userName}, function(err, users) {
            if (err) throw err;
            users.forEach(user => {
                // log the type of pagenumber
                const pageNumberInt = Number(pageNumber)-2;

                if (pageNumberInt >= 0) {
                    // create the embed message
                    const historicEmbed = new EmbedBuilder()
                    .setColor('#fc5203')
                    .setTitle(`???? Historic ${user.name} | P. ${pageNumber-1} ????`)
                    .setAuthor({ name: 'OW2 Rank tracker', iconURL: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7', url: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7' })
                    .setThumbnail('https://toppng.com/public/uploads/thumbnail/browser-history-clock-icon-vector-white-11562914072gh3hheazcj.png')
                    .addFields(
                        { name: 'Rank update', value: `*${user.historic[pageNumberInt].oldRank}*  -->  *${user.historic[pageNumberInt].newRank}*
                            **Win**: ${user.historic[pageNumberInt].win}
                            **Draw**: ${user.historic[pageNumberInt].draw}
                            **Loose**: ${user.historic[pageNumberInt].loose}
                            **Date**: ${user.historic[pageNumberInt].date.getDate()}/${user.historic[pageNumberInt].date.getMonth()}/${user.historic[pageNumberInt].date.getFullYear()}`, inline: true }
                    )
                    .setFooter({ text: 'made by @Sh0wny#3549', iconURL: 'https://cdn.discordapp.com/avatars/176945428955267073/37cd59ed3485910a859f4c5114d8eed0.png?size=1024' });

                    // Get the buttons
                    const historicButtons = getHistoricButtons();

                    // send the embed message
                    interaction.message.edit({ embeds: [historicEmbed] , components: [historicButtons] });
                    // end the interaction
                    // interaction.reply({ content: `Showing page ${newPageNumber}/${historicLength}`, ephemeral: true });     
                    interaction.deferUpdate();
                }
                else {
                    //? tell user that user not exist in db and delete after few seconds
                    interaction.reply({ content: 'Non l?? c tro, c la premiere page wesh apprend a lire aussi', ephemeral: true });
                }
            });
        });
    }

    //! Historic last page
    if (interaction.customId === 'historicLast') {
        const title = interaction.message.embeds[0].title;
        const userName = title.split(" ")[2];
        new Schema (
            { url: String, text: String, id: Number},
            { collection : 'OverwatchSR' });

        const OwHistoModel = model('OverwatchSR.historics', OverwatchSRHistoric);
        const user = OwHistoModel.find({name: userName}, function(err, users) {
            if (err) throw err;
            users.forEach(user => {
                // get the user historic
                const historic = user.historic;
                // get the user historic length
                const historicLength = (historic.length - 1);

                // create the embed message
                const historicEmbed = new EmbedBuilder()
                .setColor('#fc5203')
                .setTitle(`???? Historic ${user.name} | P. ${historic.length} ????`)
                .setAuthor({ name: 'OW2 Rank tracker', iconURL: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7', url: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7' })
                .setThumbnail('https://toppng.com/public/uploads/thumbnail/browser-history-clock-icon-vector-white-11562914072gh3hheazcj.png')
                .addFields(
                    { name: 'Rank update          ', value: `*${user.historic[historicLength].oldRank}*  -->  *${user.historic[historicLength].newRank}*
                        **Win**: ${user.historic[historicLength].win}
                        **Draw**: ${user.historic[historicLength].draw}
                        **Loose**: ${user.historic[historicLength].loose}
                        **Date**: ${user.historic[historicLength].date.getDate()}/${user.historic[historicLength].date.getMonth()}/${user.historic[historicLength].date.getFullYear()}`, inline: true }
                )
                .setFooter({ text: 'made by @Sh0wny#3549', iconURL: 'https://cdn.discordapp.com/avatars/176945428955267073/37cd59ed3485910a859f4c5114d8eed0.png?size=1024' });

                // Get the buttons
                const historicButtons = getHistoricButtons();

                // send the embed message
                interaction.message.edit({ embeds: [historicEmbed] , components: [historicButtons] });
                // end the interaction
                interaction.deferUpdate();
            });
        });
    }

    //! Historic first page
    if (interaction.customId === 'historicFirst') {
        const title = interaction.message.embeds[0].title;
        const userName = title.split(" ")[2];
        new Schema (
            { url: String, text: String, id: Number},
            { collection : 'OverwatchSR' });

        const OwHistoModel = model('OverwatchSR.historics', OverwatchSRHistoric);
        const user = OwHistoModel.find({name: userName}, function(err, users) {
            if (err) throw err;
            users.forEach(user => {
                // get the user historic
                const historic = user.historic;
                // get the user historic length
                const historicLength = (historic.length - 1);

                // create the embed message
                const historicEmbed = new EmbedBuilder()
                .setColor('#fc5203')
                .setTitle(`???? Historic ${user.name} | P. 1 ????`)
                .setAuthor({ name: 'OW2 Rank tracker', iconURL: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7', url: 'https://styles.redditmedia.com/t5_34fcr/styles/communityIcon_5n4pxtg9zlt91.jpg?width=256&format=pjpg&s=cf689284906c2c6779f56d4b60d79eed6ab313b7' })
                .setThumbnail('https://toppng.com/public/uploads/thumbnail/browser-history-clock-icon-vector-white-11562914072gh3hheazcj.png')
                .addFields(
                    { name: 'Rank update          ', value: `*${user.historic[0].oldRank}*  -->  *${user.historic[0].newRank}*
                        **Win**: ${user.historic[0].win}
                        **Draw**: ${user.historic[0].draw}
                        **Loose**: ${user.historic[0].loose}
                        **Date**: ${user.historic[0].date.getDate()}/${user.historic[0].date.getMonth()}/${user.historic[0].date.getFullYear()}`, inline: true }
                )
                .setFooter({ text: 'made by @Sh0wny#3549', iconURL: 'https://cdn.discordapp.com/avatars/176945428955267073/37cd59ed3485910a859f4c5114d8eed0.png?size=1024' });

                // Get the buttons
                const historicButtons = getHistoricButtons();

                // send the embed message
                interaction.message.edit({ embeds: [historicEmbed] , components: [historicButtons] });
                // end the interaction
                interaction.deferUpdate();
            });
        });
    }

    // historic close
    if (interaction.customId === 'historicClose') {
        interaction.message.delete();
        interaction.deferUpdate();
    }



    //! WIN
    //! WIN
    if (interaction.customId === 'win') {
        const user = interaction.message.embeds[0].title.split(" ")[1];
        console.log("Adding one win to -->", user);

        //? Its a win so
        const rank = null;
        const win = 1;
        const draw = null;
        const loose = null;

        var title = `???? ${user} ????`;
        
        new Schema (
            { url: String, text: String, id: Number},
            { collection : 'OverwatchSR' });

        const OverwatchSR = model('OverwatchSR.users', OverwatchSRSchema);

        OverwatchSR.find({name: user}, function(err, users) {
            if (err) throw err;
            
            // store the user
            var userList = users[0];

            const oldRank = userList.rank;
            const oldWin = userList.win;
            const oldDraw = userList.draw;
            const oldLoose = userList.loose;
            // create the model
            const updatedUser = new OverwatchSR({
                name: user,
                rank: oldRank,
                win: oldWin,
                draw: oldDraw,
                loose: oldLoose,
            });

            // if rank is not null update the value of rank in the database
            if (rank != null) {
                updatedUser.rank = rank;
                // reset all other values
                updatedUser.win = 0;
                updatedUser.draw = 0;
                updatedUser.loose = 0;
            }
            // if win is not null update the value of win in the database
            if (win != null) {
                updatedUser.win += win;
            }
            // if draw is not null update the value of draw in the database
            if (draw != null) {
                updatedUser.draw += draw;
            }
            // if loose is not null update the value of loose in the database
            if (loose != null) {
                updatedUser.loose += loose;
            }

            // delete the user in db
            OverwatchSR.deleteOne({name: user}, function(err) {
                if (err) throw err;
                console.log("Last version deleted");
            });

            // save the user
            updatedUser.save(function(err) {
                if (err) throw err;
                console.log('New version updated!');
            });

            // create an embed with the new values
            const newRank = updatedUser.rank;
            const newWin = updatedUser.win;
            const newDraw = updatedUser.draw;
            const newLoose = updatedUser.loose;
            
            // get the total games
            const totalGames = newWin + newLoose + newDraw;
            // get the winrate
            const winrate = Math.round((newWin / totalGames) * 100);

            // store all these new data into a dict that we return
            var newValues = {
                name: user,
                rank: newRank,
                win: newWin,
                draw: newDraw,
                loose: newLoose,
                winrate: winrate,
            };

            // create the embed message
            const embed = createEmbed(newValues.name, newValues.rank, newValues.win, newValues.draw, newValues.loose);
            const buttons = createButton();
            // send the embed message
            interaction.message.edit({ embeds: [embed] , components: [buttons] });
        });
        // reply to interaction 
        // interaction.reply({ content: 'Added one win', ephemeral: true });
        interaction.deferUpdate();
    }
    //! DRAW
    //! DRAW
    if (interaction.customId === 'draw') {
        const user = interaction.message.embeds[0].title.split(" ")[1];
        console.log("Adding one draw to -->", user);
        //? Its a draw so
        const rank = null;
        const win = null;
        const draw = 1;
        const loose = null;

        var title = `???? ${user} ????`;
        
        new Schema (
            { url: String, text: String, id: Number},
            { collection : 'OverwatchSR' });

        const OverwatchSR = model('OverwatchSR.users', OverwatchSRSchema);

        OverwatchSR.find({name: user}, function(err, users) {
            if (err) throw err;
            
            // store the user
            var userList = users[0];

            const oldRank = userList.rank;
            const oldWin = userList.win;
            const oldDraw = userList.draw;
            const oldLoose = userList.loose;
            // create the model
            const updatedUser = new OverwatchSR({
                name: user,
                rank: oldRank,
                win: oldWin,
                draw: oldDraw,
                loose: oldLoose,
            });

            // if rank is not null update the value of rank in the database
            if (rank != null) {
                updatedUser.rank = rank;
                // reset all other values
                updatedUser.win = 0;
                updatedUser.draw = 0;
                updatedUser.loose = 0;
            }
            // if win is not null update the value of win in the database
            if (win != null) {
                updatedUser.win += win;
            }
            // if draw is not null update the value of draw in the database
            if (draw != null) {
                updatedUser.draw += draw;
            }
            // if loose is not null update the value of loose in the database
            if (loose != null) {
                updatedUser.loose += loose;
            }

            // delete the user in db
            OverwatchSR.deleteOne({name: user}, function(err) {
                if (err) throw err;
                console.log("Last version deleted");
            });

            // save the user
            updatedUser.save(function(err) {
                if (err) throw err;
                console.log('New version updated!');
            });

            // create an embed with the new values
            const newRank = updatedUser.rank;
            const newWin = updatedUser.win;
            const newDraw = updatedUser.draw;
            const newLoose = updatedUser.loose;
            
            // get the total games
            const totalGames = newWin + newLoose + newDraw;
            // get the winrate
            const winrate = Math.round((newWin / totalGames) * 100);

            // store all these new data into a dict that we return
            var newValues = {
                name: user,
                rank: newRank,
                win: newWin,
                draw: newDraw,
                loose: newLoose,
                winrate: winrate,
            };

            // create the embed message
            const embed = createEmbed(newValues.name, newValues.rank, newValues.win, newValues.draw, newValues.loose);
            const buttons = createButton();
            // send the embed message
            interaction.message.edit({ embeds: [embed] , components: [buttons] });
        });
        // reply to interaction 
        // interaction.reply({ content: 'Added one win', ephemeral: true });
        interaction.deferUpdate();
    }
    //! LOOSE
    //! LOOSE
    if (interaction.customId === 'loose') {
        const user = interaction.message.embeds[0].title.split(" ")[1];
        console.log("Adding one loose to -->", user);
        //? Its a win so
        const rank = null;
        const win = null;
        const draw = null;
        const loose = 1;

        var title = `???? ${user} ????`;
        
        new Schema (
            { url: String, text: String, id: Number},
            { collection : 'OverwatchSR' });

        const OverwatchSR = model('OverwatchSR.users', OverwatchSRSchema);

        OverwatchSR.find({name: user}, function(err, users) {
            if (err) throw err;
            
            // store the user
            var userList = users[0];

            const oldRank = userList.rank;
            const oldWin = userList.win;
            const oldDraw = userList.draw;
            const oldLoose = userList.loose;
            // create the model
            const updatedUser = new OverwatchSR({
                name: user,
                rank: oldRank,
                win: oldWin,
                draw: oldDraw,
                loose: oldLoose,
            });

            // if rank is not null update the value of rank in the database
            if (rank != null) {
                updatedUser.rank = rank;
                // reset all other values
                updatedUser.win = 0;
                updatedUser.draw = 0;
                updatedUser.loose = 0;
            }
            // if win is not null update the value of win in the database
            if (win != null) {
                updatedUser.win += win;
            }
            // if draw is not null update the value of draw in the database
            if (draw != null) {
                updatedUser.draw += draw;
            }
            // if loose is not null update the value of loose in the database
            if (loose != null) {
                updatedUser.loose += loose;
            }

            // delete the user in db
            OverwatchSR.deleteOne({name: user}, function(err) {
                if (err) throw err;
                console.log("Last version deleted");
            });

            // save the user
            updatedUser.save(function(err) {
                if (err) throw err;
                console.log('New version updated!');
            });

            // create an embed with the new values
            const newRank = updatedUser.rank;
            const newWin = updatedUser.win;
            const newDraw = updatedUser.draw;
            const newLoose = updatedUser.loose;
            
            // get the total games
            const totalGames = newWin + newLoose + newDraw;
            // get the winrate
            const winrate = Math.round((newWin / totalGames) * 100);

            // store all these new data into a dict that we return
            var newValues = {
                name: user,
                rank: newRank,
                win: newWin,
                draw: newDraw,
                loose: newLoose,
                winrate: winrate,
            };

            // create the embed message
            const embed = createEmbed(newValues.name, newValues.rank, newValues.win, newValues.draw, newValues.loose);
            const buttons = createButton();
            // send the embed message
            interaction.message.edit({ embeds: [embed] , components: [buttons] });
        });
        // reply to interaction 
        // interaction.reply({ content: 'Added one win', ephemeral: true });
        interaction.deferUpdate();
    }
    //! UP RANK
    //! UP RANK
    if (interaction.customId === 'uprank') {
        const user = interaction.message.embeds[0].title.split(" ")[1];
        console.log("Updating rank of -->", user);
        
        // Create the modal
		const modal = new ModalBuilder()
            .setCustomId('RankModal')
            .setTitle('New rank');

        // Add components to modal

        // Create the text input components
        const rankInput = new TextInputBuilder()
            .setCustomId('newRankInput')
            // The label is the prompt the user sees for this input
            .setLabel("Enter you new rank")
            // Short means only a single line of text
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // An action row only holds one text input,
        // so you need one action row per text input.
        const firstActionRow = new ActionRowBuilder().addComponents(rankInput);

        // Add inputs to the modal
        modal.addComponents(firstActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    }
    if (interaction.customId === 'cancel') {
        // await interaction.reply('Not working yet');
    }

});


// detect if a modal was submitted
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId === 'RankModal') {
        const newRank = interaction.fields.getTextInputValue('newRankInput');
        const user = interaction.message.embeds[0].title.split(" ")[1];
        console.log("Updating rank of -->", user, "to -->", newRank);
        
        //? Its a rank change so
        const rank = newRank;

        var title = `???? ${user} ????`;
        
        new Schema (
            { url: String, text: String, id: Number},
            { collection : 'OverwatchSR' });

        const OverwatchSR = model('OverwatchSR.users', OverwatchSRSchema);

        OverwatchSR.find({name: user}, function(err, users) {
            if (err) throw err;
            
            // store the user
            var userList = users[0];

            const oldRank = userList.rank;
            const oldWin = userList.win;
            const oldDraw = userList.draw;
            const oldLoose = userList.loose;

            // create the model
            const updatedUser = new OverwatchSR({
                name: user,
                rank: oldRank,
                win: oldWin,
                draw: oldDraw,
                loose: oldLoose,
            });

            // Save to the historic database
            saveHistoric(oldRank , rank , user , oldWin , oldDraw , oldLoose);

            // if rank is not null update the value of rank in the database
            if (rank != null) {
                updatedUser.rank = rank;
                // reset all other values
                updatedUser.win = 0;
                updatedUser.draw = 0;
                updatedUser.loose = 0;
            }

            // delete the user in db
            OverwatchSR.deleteOne({name: user}, function(err) {
                if (err) throw err;
                console.log("Last version deleted");
            });

            // save the user
            updatedUser.save(function(err) {
                if (err) throw err;
                console.log('New version updated!');
            });

            // create an embed with the new values
            const newRank = updatedUser.rank;
            const newWin = updatedUser.win;
            const newDraw = updatedUser.draw;
            const newLoose = updatedUser.loose;
            
            // get the total games
            const totalGames = newWin + newLoose + newDraw;
            // get the winrate
            const winrate = Math.round((newWin / totalGames) * 100);

            // store all these new data into a dict that we return
            var newValues = {
                name: user,
                rank: newRank,
                win: newWin,
                draw: newDraw,
                loose: newLoose,
                winrate: winrate,
            };

            // create the embed message
            const embed = createEmbed(newValues.name, newValues.rank, newValues.win, newValues.draw, newValues.loose);
            const buttons = createButton();

            // send the embed message
            interaction.message.edit({ embeds: [embed] , components: [buttons] });
        });
        // reply to interaction 
        interaction.reply({ content: 'New rank added', ephemeral: true });
    }
});

// create the funtion that create an embed message with parameters (user, rank, win, draw, loose)
function createEmbed(user, rank, win, draw, loose) {
    // get the total games
    const totalGames = win + loose + draw;
    // get the winrate
    const winrate = Math.round((win / totalGames) * 100);

    const trackerEmbed = new EmbedBuilder()
        .setColor('#fc5203')
        .setTitle(`???? ${user} ????`)
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
            .setEmoji('????'),
        new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle('Primary')
            .setDisabled(true)
            .setEmoji('????')
    );
    return buttons;
}

function updateEmbed(user, rank, win, draw, loose) {
    console.log("Updating the embed message");

    // Title
    var title = `???? ${user} ????`;
    
    new Schema (
        { url: String, text: String, id: Number},
        { collection : 'OverwatchSR' });

    const OverwatchSR = model('OverwatchSR.users', OverwatchSRSchema);


    OverwatchSR.find({name: user}, function(err, users) {
        if (err) throw err;
        
        // store the user
        var userList = users[0];

        const oldRank = userList.rank;
        const oldWin = userList.win;
        const oldDraw = userList.draw;
        const oldLoose = userList.loose;
        // create the model
        const updatedUser = new OverwatchSR({
            name: user,
            rank: oldRank,
            win: oldWin,
            draw: oldDraw,
            loose: oldLoose,
        });

        // if rank is not null update the value of rank in the database
        if (rank != null) {
            updatedUser.rank = rank;
            // reset all other values
            updatedUser.win = 0;
            updatedUser.draw = 0;
            updatedUser.loose = 0;
        }
        // if win is not null update the value of win in the database
        if (win != null) {
            updatedUser.win += win;
        }
        // if draw is not null update the value of draw in the database
        if (draw != null) {
            updatedUser.draw += draw;
        }
        // if loose is not null update the value of loose in the database
        if (loose != null) {
            updatedUser.loose += loose;
        }

        // delete the user in db
        OverwatchSR.deleteOne({name: user}, function(err) {
            if (err) throw err;
            console.log("Last version deleted");
        });

        // save the user
        updatedUser.save(function(err) {
            if (err) throw err;
            console.log('New version updated!');
        });

        // create an embed with the new values
        const newRank = updatedUser.rank;
        const newWin = updatedUser.win;
        const newDraw = updatedUser.draw;
        const newLoose = updatedUser.loose;
        
        // get the total games
        const totalGames = newWin + newLoose + newDraw;
        // get the winrate
        const winrate = Math.round((newWin / totalGames) * 100);

        // store all these new data into a dict that we return
        var newValues = {
            name: user,
            rank: newRank,
            win: newWin,
            draw: newDraw,
            loose: newLoose,
            winrate: winrate,
        };


    });
}


function saveHistoric(oldRank , newRank , userName , win , draw , loose) {

    new Schema (
        { url: String, text: String, id: Number}, 
        { collection : 'OverwatchSR' }
    );

    // create the model
    const OwHistoModel = model('OverwatchSR.historic', OverwatchSRHistoric);


    // in the collection overwatchsr.historics find where the name == userName, and add a new value to the list historic with the oldRank, new rank, win draw and loose
    OwHistoModel.find({name: userName}, function(err, users) {
        if (err) throw err;

        // add the values to the list
        users[0].historic.push({
            oldRank: oldRank,
            newRank: newRank,
            date: Date.now(),
            win: win,
            draw: draw,
            loose: loose,
        });

        // update the db
        OwHistoModel.updateOne({name: userName}, users[0], function(err) {
            if (err) throw err;
            console.log("Historic updated");
        }
        );

    });

}



//TODO Buttons
//! --> Historic page
function getHistoricButtons() {
    const historicButtons = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
        .setCustomId('historicFirst')
        .setEmoji('???')
        .setStyle('Primary')
        .setDisabled(false),
        new ButtonBuilder()
        .setCustomId('historicPrev')
        .setEmoji('??????')
        .setStyle('Primary')
        .setDisabled(false),
        new ButtonBuilder()
        .setCustomId('historicNext')
        .setEmoji('??????')
        .setStyle('Primary'),
        new ButtonBuilder()
        .setCustomId('historicLast')
        .setEmoji('???')
        .setStyle('Primary')
        .setDisabled(false),
        new ButtonBuilder()
        .setCustomId('historicExport')
        .setLabel('Export')
        .setEmoji('????')
        .setStyle('Success')
        .setDisabled(true)
    );
    return historicButtons;
}





client.login(process.env.DISCORD_TOKEN);


// connect to mongodb and log if connected
(async () => {
    await connect(process.env.MONGO_TOKEN).catch(console.error);
})();
