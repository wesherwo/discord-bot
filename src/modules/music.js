// const Discord = require('discord.js');
// const yt = require('ytdl-core');
// var bot;
// var prefix;
// let queue = {};

// exports.commands = {
// 	'play': (msg) => {
// 		playSong(msg);
// 	},
// 	'join': (msg) => {
// 		joinChan(msg);
// 	},
// 	'add': (msg) => {
// 		addSong(msg);
// 	},
// 	'queue': (msg) => {
// 		showQueue(msg);
// 	},
// 	'playnext': (msg) => {
// 		playNext(msg);
// 	},
// 	'addnext': (msg) => {
// 		addNext(msg);
// 	},
// 	'songhelp': (msg) => {
// 		getSongHelp(msg);
// 	}
// }

// exports.getHelp = () => {
// 	return [{ name: prefix + "songhelp", value: "Music commands." }];
// }

// exports.setRefs = (refs) => {
// 	bot = refs.bot;
// 	prefix = refs.prefix;
// }

// function getSongHelp(msg) {
// 	let tosend = {
// 		embed: {
// 			color: 3447003,
// 			title: "List of commands",
// 			fields: []
// 		}
// 	};
// 	tosend.embed.fields =
// 		[{ name: prefix + "join", value: "Join Voice channel of msg sender" },
// 		{ name: prefix + "add [song]", value: "Add a valid youtube link to the queue" },
// 		{ name: prefix + "addNext [song]", value: "Add a valid youtube link to the front of the queue" },
// 		{ name: prefix + "playNext", value: "Move a song in the queue to the front" },
// 		{ name: prefix + "queue", value: "Shows the current queue, up to 15 songs shown." },
// 		{ name: prefix + "play", value: "Play the music queue if already joined to a voice channel" },
// 		{ name: prefix + "pause", value: "pauses the music" },
// 		{ name: prefix + "resume", value: "resumes the music" },
// 		{ name: prefix + "skip", value: "skips the playing song" },
// 		{ name: prefix + "time", value: "Shows the playtime of the song." },
// 		{ name: prefix + "stop", value: "stops the bot." },
// 		{ name: prefix + "volume+(+++)", value: "increases volume by 2%/+" },
// 		{ name: prefix + "volume-(---)", value: "decreases volume by 2%/-" }];
// 	msg.channel.send(tosend);
// }

// function playSong(msg) {
// 	if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Add some songs to the queue first with ${prefix}add`);
// 	if (!msg.guild.voiceConnection) return commands.join(msg).then(() => commands.play(msg));
// 	if (queue[msg.guild.id].playing) return msg.channel.sendMessage('Already Playing');
// 	let dispatcher;
// 	queue[msg.guild.id].playing = true;

// 	console.log(queue);
// 	(function play(song) {
// 		console.log(song);
// 		if (song === undefined) return msg.channel.sendMessage('Queue is empty').then(() => {
// 			queue[msg.guild.id].playing = false;
// 			msg.member.voiceChannel.leave();
// 		});
// 		msg.channel.sendMessage(`Playing: **${song.title}** as requested by: **${song.requester}**`);
// 		dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, { audioonly: true }), { passes: 5 });
// 		let collector = msg.channel.createCollector(m => m);
// 		collector.on('message', m => {
// 			if (m.content.startsWith(prefix + 'pause')) {
// 				msg.channel.sendMessage('paused').then(() => { dispatcher.pause(); });
// 			} else if (m.content.startsWith(prefix + 'resume')) {
// 				msg.channel.sendMessage('resumed').then(() => { dispatcher.resume(); });
// 			} else if (m.content.startsWith(prefix + 'skip')) {
// 				msg.channel.sendMessage('skipped').then(() => { dispatcher.end(); });
// 			} else if (m.content.startsWith(prefix + 'stop')) {
// 				msg.channel.sendMessage('stopped')
// 				queue[msg.guild.id].songs.forEach(() => { queue[msg.guild.id].songs.shift(); });
// 				dispatcher.end();
// 			} else if (m.content.startsWith('volume+')) {
// 				if (Math.round(dispatcher.volume * 50) >= 100) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume * 50)}%`);
// 				dispatcher.setVolume(Math.min((dispatcher.volume * 50 + (2 * (m.content.split('+').length - 1))) / 50, 2));
// 				msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume * 50)}%`);
// 			} else if (m.content.startsWith('volume-')) {
// 				if (Math.round(dispatcher.volume * 50) <= 0) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume * 50)}%`);
// 				dispatcher.setVolume(Math.max((dispatcher.volume * 50 - (2 * (m.content.split('-').length - 1))) / 50, 0));
// 				msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume * 50)}%`);
// 			} else if (m.content.startsWith(prefix + 'time')) {
// 				msg.channel.sendMessage(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000) / 1000) < 10 ? '0' + Math.floor((dispatcher.time % 60000) / 1000) : Math.floor((dispatcher.time % 60000) / 1000)}`);
// 			}
// 		});
// 		dispatcher.on('end', () => {
// 			collector.stop();
// 			console.log("end");
// 			play(queue[msg.guild.id].songs.shift());
// 		});
// 		dispatcher.on('error', (err) => {
// 			return msg.channel.sendMessage('error: ' + err).then(() => {
// 				collector.stop();
// 				console.log("error");
// 				play(queue[msg.guild.id].songs.shift());
// 			});
// 		});
// 	})(queue[msg.guild.id].songs.shift());
// }

// function joinChan(msg) {
// 	return new Promise((resolve, reject) => {
// 		const voiceChannel = msg.member.voiceChannel;
// 		if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('I couldn\'t connect to your voice channel...');
// 		voiceChannel.join().then(connection => resolve(connection)).catch(err => reject(err));
// 	});
// }

// function addSong(msg) {
// 	let url = msg.content.split(' ')[1];
// 	if (url == '' || url === undefined) return msg.channel.sendMessage(`You must add a YouTube video url, or id after ${prefix}add`);
// 	yt.getInfo(url, (err, info) => {
// 		if (err) return msg.channel.sendMessage('Invalid YouTube Link: ' + err);
// 		if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
// 		queue[msg.guild.id].songs.push({ url: url, title: info.title, requester: msg.author.username });
// 		msg.channel.sendMessage(`added **${info.title}** to the queue`);
// 	});
// }

// function showQueue(msg) {
// 	if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Add some songs to the queue first with ${prefix}add`);
// 	let tosend = [];
// 	queue[msg.guild.id].songs.forEach((song, i) => { tosend.push(`${i + 1}. ${song.title} - Requested by: ${song.requester}`); });
// 	msg.channel.sendMessage(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0, 15).join('\n')}\`\`\``);
// }

// function playNext(msg) {
// 	let text = msg.content.split(' ')[1];
// 	let pos = (parseInt(text)) - 1;
// 	let elem = queue[msg.guild.id].songs[pos];
// 	queue[msg.guild.id].songs.splice(pos, 1);
// 	queue[msg.guild.id].songs.splice(0, 0, elem);
// 	return msg.channel.sendMessage(`${elem.title} moved to the front of the queue`);
// }

// function addNext(msg) {
// 	let url = msg.content.split(' ')[1];
// 	if (url == '' || url === undefined) return msg.channel.sendMessage(`You must add a YouTube video url, or id after ${prefix}add`);
// 	yt.getInfo(url, (err, info) => {
// 		if (err) return msg.channel.sendMessage('Invalid YouTube Link: ' + err);
// 		if (!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
// 		queue[msg.guild.id].songs.splice(0, 0, { url: url, title: info.title, requester: msg.author.username });
// 		msg.channel.sendMessage(`added **${info.title}** to the front of the queue`);
// 	});
// }