const ytdl = require('ytdl-core');
const fs = require("fs");
const fetch = require("node-fetch");
var bot;
var prefix;

const settings = JSON.parse(fs.readFileSync("settings.json"));
const YOUTUBE_API_KEY = settings["YTtoken"];
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
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
		{ name: prefix + "stop", value: "Stop playing music" }];
	msg.channel.send(tosend);
}

async function execute(message) {
	var query = message.content.substring(message.content.indexOf(" "));
  
	const voiceChannel = message.member.voiceChannel;
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

	if(!query.includes('https://www.youtube.com')){
		url = YOUTUBE_API_URL + '?part=snippet&maxResults=1&q=' + query + '&key=' + YOUTUBE_API_KEY
		await fetch(url)
		.then(response => response.json())
		.then(data => {
			query = 'https://www.youtube.com/watch?v=' + data.items[0].id.videoId;
		});
	}
	const songInfo = await ytdl.getInfo(query);
	const song = {
	  title: songInfo.videoDetails.title,
	  url: songInfo.url
	};

	if(!player.playing) {
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
		if(voiceChannel != player.voiceChannel){
			return message.channel.send(`I am already playing in another channel.`);
		}
		player.playlist.push(song);
		return message.channel.send(`${song.title} has been added to the queue!`);
	}
  }
  
  function skip(message) {
	if (!message.member.voiceChannel)
	  return message.channel.send(
		"You have to be in a voice channel to stop the music!"
	  );
	if (!player.playing)
	  return message.channel.send("There is no song that I could skip!");

	if(message.member.voiceChannel != player.voiceChannel){
		return message.channel.send(`You are not in the channel playing music.`);
	}
	player.dispatcher.end();
  }
  
  function stop(message) {
	if (!message.member.voiceChannel)
	  return message.channel.send(
		"You have to be in a voice channel to stop the music!"
	  );
	if(message.member.voiceChannel != player.voiceChannel){
		return message.channel.send(`You are not in the channel playing music.`);
	}
	player.dispatcher.end();
	clearPlayer();
  }
  
  function play(chan, song) {
	player.playing = true;
	if (!song) {
		player.voiceChannel.leave();
		player.playing = false;
		clearPlayer();
	  return;
	}
  
	player.dispatcher = player.connection
	  .playStream(ytdl(song.url, {filter: "audioonly"}))
	  .on("end", () => {
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