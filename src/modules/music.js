const ytdl = require('ytdl-core');
const fs = require("fs");
const fetch = require("node-fetch");
const { getMaxListeners } = require('process');
var bot;
var prefix;

const settings = JSON.parse(fs.readFileSync("settings.json"));
const YOUTUBE_API_KEY = settings["YTtoken"];
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
const savedPlaylists = "SaveData/songPlaylists.json";
var player = {
	playlist: [],
	voiceChannel: null,
	textChannel: null,
	connection: null,
	dispatcher: null,
	volume: 5,
	playing: false
};

exports.commands = {
	'play': (msg) => {
		execute(msg);
	},
	'skip': (msg) => {
		skip(msg);
	},
	'stop': (msg) => {
		stop(msg);
	},
	'shuffle': (msg) => {
		shufflePlaylist(msg);
	},
	'playplaylist': (msg) => {
		playPlaylist(msg);
	},
	'playlists': (msg) => {
		playlists(msg);
	},
	'playlist': (msg) => {
		printPlaylist(msg);
	},
	'makeplaylist': (msg) => {
		makePlaylist(msg);
	},
	'deleteplaylist': (msg) => {
		deletePlaylist(msg);
	},
	'addtoplaylist': (msg) => {
		addSongToPlaylist(msg);
	},
	'removefromplaylist': (msg) => {
		removeSongFromPlaylist(msg);
	},
	'songhelp': (msg) => {
		getSongHelp(msg);
	}
}

exports.getHelp = () => {
	return [{ name: prefix + "songhelp", value: "Music commands." }];
}

exports.setRefs = (refs) => {
	bot = refs.bot;
	prefix = refs.prefix;
}

function getSongHelp(msg) {
	let tosend = {
		embed: {
			color: 3447003,
			title: "List of commands",
			fields: []
		}
	};
	tosend.embed.fields =
		[{ name: prefix + "play [song]", value: "Add a song to the queue" },
		{ name: prefix + "skip", value: "Skip the current song" },
		{ name: prefix + "stop", value: "Stop playing music" },
		{ name: prefix + "shuffle", value: "Shuffle the playlist" },
		{ name: prefix + "playplaylist [name]", value: "Adds a playlist to the queue" },
		{ name: prefix + "playlists", value: "Shows playlist names and song count" },
		{ name: prefix + "playlist [name]", value: "Shows songs on playlist" },
		{ name: prefix + "makeplaylist [name]", value: "Creates a playlist with the name given.(name can only be one word)" },
		{ name: prefix + "deleteplaylist [name]", value: "Deletes a playlist" },
		{ name: prefix + "addtoplaylist [playlist] [song]", value: "Adds a song to the playlist" },
		{ name: prefix + "removefromplaylist [playlist] [song]", value: "Removes a song from the playlist" }];
	msg.channel.send(tosend);
}

async function execute(message) {
	var query = message.content.substring(message.content.indexOf(" "));

	const voiceChannel = message.member.voice.channel;
	if (!voiceChannel)
		return message.channel.send(
			"You need to be in a voice channel to play music!"
		);
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
		return message.channel.send(
			"I need the permissions to join and speak in your voice channel!"
		);
	}

	const song = await songSearch(query);

	if (!player.playing) {
		player.textChannel = message.channel
		player.voiceChannel = voiceChannel;
		player.playlist = [song];
		try {
			var connection = await voiceChannel.join();
			player.connection = connection;
			play(player.voiceChannel, player.playlist[0]);
		} catch (err) {
			console.log(err);
			clearPlayer();
			return message.channel.send(err);
		}
	}
	else {
		if (voiceChannel != player.voiceChannel) {
			return message.channel.send(`I am already playing in another channel.`);
		}
		player.playlist.push(song);
		return message.channel.send(`${song.title} has been added to the queue!`);
	}
}

async function songSearch(query) {
	if (!query.includes('https://www.youtube.com')) {
		url = YOUTUBE_API_URL + '?part=snippet&maxResults=1&q=' + query + '&key=' + YOUTUBE_API_KEY;
		await fetch(url)
			.then(response => response.json())
			.then(data => {
				query = 'https://www.youtube.com/watch?v=' + data.items[0].id.videoId;
			});
	}
	const songInfo = await ytdl.getInfo(query);
	const song = {
		title: songInfo.videoDetails.title,
		url: query
	};
	return song;
}

function skip(message) {
	if (!message.member.voice.channel)
		return message.channel.send(
			"You have to be in a voice channel to stop the music!"
		);
	if (!player.playing)
		return message.channel.send("There is no song that I could skip!");

	if (message.member.voice.channel != player.voiceChannel) {
		return message.channel.send(`You are not in the channel playing music.`);
	}
	player.dispatcher.end();
}

function stop(message) {
	if (!message.member.voice.channel)
		return message.channel.send(
			"You have to be in a voice channel to stop the music!"
		);
	if (message.member.voice.channel != player.voiceChannel) {
		return message.channel.send(`You are not in the channel playing music.`);
	}
	player.connection.disconnect();
	clearPlayer();
}

function play(chan, song) {
	player.playing = true;
	if (!song) {
		player.connection.disconnect();
		player.playing = false;
		clearPlayer();
		return;
	}

	player.dispatcher = player.connection
		.play(ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 }), { highWaterMark: 1 })
		.on("finish", () => {
			player.playlist.shift();
			play(chan, player.playlist[0]);
		})
		.on("error", error => console.error(error));
	player.dispatcher.setVolumeLogarithmic(player.volume / 5);
	player.textChannel.send(`Start playing: **${song.title}**`);
}

function clearPlayer() {
	player = {
		playlist: [],
		voiceChannel: null,
		textChannel: null,
		connection: null,
		dispatcher: null,
		volume: 5,
		playing: false
	};
}

function shufflePlaylist(msg) {
	var currSong = player.playlist.shift();
	player.playlist = shuffle(player.playlist);
	player.playlist.unshift(currSong);
	msg.channel.send("Current Playlist shuffled.");
}

function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;

	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

async function playPlaylist(msg) {
	const voiceChannel = msg.member.voice.channel;
	if (player.playing == true && voiceChannel != player.voiceChannel) {
		return msg.channel.send(`I am already playing in another channel.`);
	}
	var playlists = JSON.parse(fs.readFileSync(savedPlaylists));
	var toPlay = msg.content.substring(msg.content.indexOf(" ")).trim();
	if (!playlists.playlists.hasOwnProperty(toPlay)) {
		return msg.channel.send("Playlist does not exist.");
	}
	for (var song in playlists.playlists[toPlay]) {
		player.playlist.push(playlists.playlists[toPlay][song]);
	}
	player.playlist = shuffle(player.playlist);
	msg.channel.send(`${toPlay} songs have been added to the queue!`);
	console.log(player.playlist);
	if (!player.playing) {
		player.textChannel = msg.channel
		player.voiceChannel = voiceChannel;
		try {
			var connection = await voiceChannel.join();
			player.connection = connection;
			play(player.voiceChannel, player.playlist[0]);
		} catch (err) {
			console.log(err);
			clearPlayer();
			return msg.channel.send(err);
		}
	}
}

function playlists(msg) {
	var saved = JSON.parse(fs.readFileSync(savedPlaylists));
	var tosend = ["Playlists:"];
	for (var playlist in saved.playlists) {
		tosend.push(playlist + " - " + saved.playlists[playlist].length + " songs");
		tosend.push("\n");
	}
	msg.channel.send(tosend);
}

function printPlaylist(msg) {
	var playlists = JSON.parse(fs.readFileSync(savedPlaylists));
	var toPlay = msg.content.substring(msg.content.indexOf(" ")).trim();
	var tosend = ["Songs:"];
	if (!playlists.playlists.hasOwnProperty(toPlay)) {
		return msg.channel.send("Playlist does not exist.");
	}
	for (var song in playlists.playlists[toPlay]) {
		tosend.push(playlists.playlists[toPlay][song].title);
	}
	msg.channel.send(tosend);
}

function makePlaylist(msg) {
	var newPlaylist = msg.content.substring(msg.content.indexOf(" ")).trim();
	if (newPlaylist.includes(" ")) {
		return msg.channel.send("Playlist name cannot include spaces.");
	}
	var saved = JSON.parse(fs.readFileSync(savedPlaylists));
	if (saved.playlists.hasOwnProperty(newPlaylist)) {
		return msg.channel.send("Playlist already exists.");
	}
	saved.playlists[newPlaylist] = [];
	var jsonData = JSON.stringify(saved);
	fs.writeFileSync(savedPlaylists, jsonData, function (err) { if (err) { console.log(err); } });
	msg.channel.send(`${newPlaylist} created.`);
}

function deletePlaylist(msg) {
	var playlist = msg.content.substring(msg.content.indexOf(" ")).trim();
	var saved = JSON.parse(fs.readFileSync(savedPlaylists));
	if (!saved.playlists.hasOwnProperty(playlist)) {
		return msg.channel.send("Playlist does not exist.");
	}
	delete saved.playlists[playlist];
	var jsonData = JSON.stringify(saved);
	fs.writeFileSync(savedPlaylists, jsonData, function (err) { if (err) { console.log(err); } });
	msg.channel.send(`${playlist} deleted.`);
}

async function addSongToPlaylist(msg) {
	var playlist = msg.content.substring(msg.content.indexOf(" ")).trim();
	var newSong = playlist.substring(playlist.indexOf(" ")).trim();
	playlist = playlist.substring(0, playlist.indexOf(" ")).trim();
	var playlists = JSON.parse(fs.readFileSync(savedPlaylists));
	if (!playlists.playlists.hasOwnProperty(playlist)) {
		return msg.channel.send("Playlist does not exist.");
	}
	song = await songSearch(newSong);
	playlists.playlists[playlist].push(song);
	var jsonData = JSON.stringify(playlists);
	fs.writeFileSync(savedPlaylists, jsonData, function (err) { if (err) { console.log(err); } });
	msg.channel.send(`${song.title} added to ${playlist}.`);
}

async function removeSongFromPlaylist(msg) {
	var playlist = msg.content.substring(msg.content.indexOf(" ")).trim();
	var newSong = playlist.substring(playlist.indexOf(" ")).trim();
	playlist = playlist.substring(0, playlist.indexOf(" ")).trim();
	var playlists = JSON.parse(fs.readFileSync(savedPlaylists));
	if (!playlists.playlists.hasOwnProperty(playlist)) {
		return msg.channel.send("Playlist does not exist.");
	}
	song = await songSearch(newSong);
	playlists.playlists[playlist].splice(playlists.playlists[playlist].find(e => e.title.localeCompare(song.title) && e.url.localeCompare(song.url)),1);
	var jsonData = JSON.stringify(playlists);
	fs.writeFileSync(savedPlaylists, jsonData, function (err) { if (err) { console.log(err); } });
	msg.channel.send(`${song.title} removed from ${playlist}.`);
}