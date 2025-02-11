async function handleResource(video, message, args, voice_channel, player, type, playlist, client) {
    const Discord = require('discord.js');
    const playdl = require('play-dl')
    const { roleColor } = require('../../util/lechsbottFunctions')
    const Voice = require('@discordjs/voice')
    const { removeAndClear, defineAuthor } = require('./reasonFunctions')

    const queue = client.queue
    const server_queue = queue.get(message.guild.id)

    const song = {
        title: video.title,
        url: video.url,
        type: video.type,
        app: video.app,
        customurl: video.customurl,
        addedby: video.addedby,
        addedid: video.addedid,
        duration: video.duration,
    };

    function findTypeAndSend(content) {
        if (message.type !== 'APPLICATION_COMMAND') {
            return message.channel.send(content)
        } else {
            return message.followUp(content)
        }
    }

    if (!server_queue) {

        const queue_constructor = {
            voice_channel: message.member.voice.channel,
            text_channel: message.channel,
            player: null,
            connection: null,
            songs: [],
            volume: 1,
            playing: true,
            resource: null,
            playinginfo: true,
        }

        queue.set(message.guild.id, queue_constructor);
        queue_constructor.songs.push(song);

        const lechsbottPlayer = async (guild, song) => {
            const queue = client.queue
            if (!song) {
                return;
            }

            const song_queue = queue.get(message.guild.id)
            console.log(song)

            if (song_queue.voice_channel.type === 'GUILD_STAGE_VOICE') {
                message.guild.me.voice.setSuppressed(false)
            }

            if (song.type === 'normal') {
                // const stream = ytdl(song.url, { filter: 'audioonly', highWaterMark: 32, quality: 'highestaudio', });
                let stream = await playdl.stream(song.url)

                let resource = Voice.createAudioResource(stream.stream, {
                    inputType: stream.type
                })
                queue_constructor.resource = resource;

                player.subscribe(song_queue.player);
                song_queue.player.play(resource);
            }
            if (song.type === 'sc') {

                let stream
                try {
                    stream = await scdlcore.download(song.url)
                } catch (e) {
                    const embed = new Discord.MessageEmbed()
                        .setDescription(`**There is a problem with the** \`${song_queue.songs[0].title}\`\nIf next track available player skip to it!`)
                    findTypeAndSend({ embeds: [embed] });
                    song_queue.songs.shift()

                    if (song_queue.songs[0]) {
                        lechsbottPlayer(message.guild, song_queue.songs[0]);
                    } else {
                        queue.delete(guild.id);
                        song_queue.player.stop(true);
                        console.log('deleted song queue because of error');
                    }
                    return
                }
            }

            if (song_queue.playinginfo === true) {
                let playing = new Discord.MessageEmbed()
                    .setColor(roleColor(message))
                    .setAuthor(
                        (name = `Now playing`),
                        (icon_url = `${defineAuthor(message, 'displayAvatarURL')}`)
                    )
                    .setTitle(`${song.title}`)
                    .setURL(`${song.customurl}`)
                    .setFooter(`${song.addedby}`)
                    .setTimestamp();

                song_queue.text_channel.send({ embeds: [playing] })
            }

        };

        try {
            let player = Voice.createAudioPlayer();
            queue_constructor.player = player;

            const connection = Voice.getVoiceConnection(
                queue_constructor.voice_channel.guild.id,
                'default'
            );
            queue_constructor.connection = connection;

            lechsbottPlayer(message.guild, queue_constructor.songs[0]);

            queue_constructor.player.on('stateChange', async (oldState, newState) => {
                console.log(
                    `Audio player transitioned ${oldState.status} to ${newState.status}`
                );

                if (newState.status === "idle" && oldState.status !== "idle") {
                    if (queue_constructor.songs[1]) {
                        queue_constructor.songs.shift();
                        return lechsbottPlayer(message.guild, queue_constructor.songs[0]);
                    }
                    
                    return removeAndClear(queue, message)
                }
            });

            queue_constructor.connection.on('stateChange', async (oldState, newState) => {
                if (newState.status === "disconnected" && oldState.status !== "disconnected") {
                    return removeAndClear(queue, message)
                }
            })

        } catch (err) {
            removeAndClear(queue, message)
            const embed = new Discord.MessageEmbed()
                .setColor(roleColor(message))
                .setDescription(`**There was an error connecting!**`)
            findTypeAndSend(embed);
            console.log(err)
        }
    } else {
        server_queue.songs.push(song)

        if (playlist === 'youtubeplaylist') return undefined;
        else if (playlist === 'spotifyplaylist') return undefined;
        else if (playlist === 'soundcloudplaylist') return undefined;
        else if (playlist === 'false') {

            let memberavatar = defineAuthor(message, 'displayAvatarURL')
            let queueInfo = new Discord.MessageEmbed()
                .setColor(roleColor(message))
                .setAuthor((name = `Added to queue`), (icon_url = `${memberavatar}`))
                .setTitle(`${song.title}`)
                .setURL(`${song.customurl}`)
                .setTimestamp()
                .setFooter(`${song.addedby}`);

            return findTypeAndSend({ embeds: [queueInfo] }).then((message) => {
                message.react('👍');
            });
        }
    }
    return undefined;
}

exports.handleResource = handleResource