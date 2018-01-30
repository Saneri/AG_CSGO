
const discord = require("discord.js");
const mysql = require("mysql");
const winston = require("winston");
const auth = require("./auth.json");
const trueskill = require("trueskill");
const bot = new discord.Client();

const maxQueueSize = 10;
const defaultRating = 1000;
var matchRunning = false;
var queue = [];

const logger = winston.createLogger({
	level: "info",
	format: winston.format.simple(),
	transports: [ 
	    new winston.transports.File({ filename: "bot.log" })
	]
});

var con = mysql.createConnection({
	host: "localhost",
	user: "aaltogamers",
	password: "aaltogamers",
	database: "database"
});


bot.on("ready", () => {
	con.connect(function(err) {
		  if (err) {
			  logger.error(err);
			  throw err;
		  }
		  logger.info("Succesfully connected to mySQL server.");
	});
	logger.info('Bot is ready.');
});

bot.on("message", async message => {
	if (message.author.bot) return;
	if (message.content.substring(0,1) !== '!') return;
	
	logger.info(message.content);
	const args = message.content.slice(1).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	
	switch (command) {
		
		// !joinqueue
		case "joinqueue":
			var sql = `SELECT name FROM players WHERE name='${message.author}'`;
			con.query(sql, function(err, result) {
				if (err) {
					logger.error(err);
					message.channel.send("Database error. Contact admin");
				} else {
					// Add player to database if not found
					if (result.length === 0) {
						var addplayer = `INSERT INTO players (name,ign,rating,decaying) VALUES ('${message.author}', '${args.shift()}',${defaultRating} , 0)`;
						con.query(addplayer, function(err) { //,result
							if (err) {
								message.channel.send(`Adding ${message.author} to database failed.`);
								logger.error(err);
							} else {
								message.channel.send(`${message.author} has been added to the ladder!`)
								logger.info(`${message.author.username} has been added to the ladder!`)
							}	
						});
					}
					// finally add player to queue
					if (!queue.includes(message.author)) {
						queue.push(message.author);
						message.channel.send(`${message.author} has joined the queue.`);
					} else {
						message.channel.send(`${message.author} is already in the queue.`);
					}
					if (queue.length === maxQueueSize) startMatch();
				}  
			});
			break;
		
		
			// !leavequeue
			case "leavequeue":
				if (queue.includes(message.author)) {
					queue.splice(queue.indexOf(message.author), 1);
					message.channel.send(`${message.author} has left the queue.`);
				} else {
					message.channel.send(`${message.author} is not in the queue.`);
				}
					
				break;
			
			// !queue	
			// Displays queue size and its members.
			case "queue":
				if (queue.length == 0) {
					message.channel.send("Queue is empty.");
				} else {
					var queuestatus = "";
					queuestatus += `Queue: ${queue.length}/${maxQueueSize}`;
					for (var i=0, len=queue.length; i<len; i++) {
						queuestatus += `\n ${queue[i].username}`;
					}
					if (message.channel.type === "text") {
						message.channel.send(queuestatus);
					} else {
						message.author.send(queuestatus);
					}
				}
				break;
				// !rating
				// Displays the rating and ladder position of the message author
			case "rating":
				var sql = `SELECT name FROM players WHERE name='${message.author}'`;
				con.query(sql, function(err, result) {
					var rating = "";
					if (err) {
						logger.error(err);
						message.channel.send("Database error. Contact admin");
						return;
					} else if (result.length != 0) {
						rating = `${message.author}'s rating is: ${result[0].rating}`;
					} else {
						rating = `${message.author} doesn't have a rating yet.`;
					}
					if (message.channel.type === "text") {
						message.channel.send(rating);
					} else {
						message.author.send(rating);
					}
				});
				break;
			
			// !ladder
			// Displays the whole ladder with positions and player names
			case "ladder":
				var sql = "SELECT name, rating FROM players";
				con.query(sql, function(err, result) {
					if (err) {
						logger.error(err);
						message.channel.send("Database error. Contact admin");
					} else {
						
					}
				});
				break;
			
			// !commands and !help
			// Info for new users. Descripes the commands
			case "commands":
			case "help":
				message.author.send({embed: {
				    color: 3447003,
				    title: "--- Commands ---",
				    fields: [{
				        name: "!joinqueue",
				        value: "Join the queue if it's not currently full. Adds new players to ladder."
				    },
				    {
				    	name: "!leavequeue",
				    	value: "Leave the queue."
				    },
				    {
				    	name: "!queue",
				    	value: "Display current queue and it's members."
				    },
				    {
				    	name: "!rating",
				    	value: "Display your current rating and position in the ladder."
				    }],
				  }
				});
						
				break;
			
	}
});


function startMatch() {
	//start match here, lock queue, give players connect info
	logger.info("/n --- Match begin ---")
}

// Start bot
bot.login(auth.token);
