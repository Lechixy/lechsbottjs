const { PREFIX } = require('../util/lechsbottUtil')
const moment = require("moment")
const progressbar = require('string-progressbar');
const { roleColor } = require('../util/lechsbottFunctions')

module.exports = {
    name: 'queue',
    description: '',
    category: ['Music'],
    async execute(client, message, args, cmd, Discord) {

        const queue = client.queue
        const server_queue = queue.get(message.guild.id)

        if (!server_queue) {
            const embed = new Discord.MessageEmbed()
                .setAuthor(`There is no this guild`, message.author.displayAvatarURL({ dynamic: true }))
                .setDescription(`Want to add song to the queue? **${PREFIX}play <query>**`)
                .setColor(roleColor(message))
            return message.channel.send({ embeds: [embed] });
        }

        const songduration = server_queue.resource.playbackDuration
        const totaltime = server_queue.songs[0].duration.toString()

        let elapsedtime

        if (totaltime.length >= 7) {
            elapsedtime = `${formatTime(moment.duration(songduration).hours())}:${formatTime(moment.duration(songduration).minutes())}:${formatTime(moment.duration(songduration).seconds())}`
        } else {
            elapsedtime = `${moment.duration(songduration).minutes()}:${formatTime(moment.duration(songduration).seconds())}`
        }

        const bar = progressbar.splitBar(timeConverter(totaltime), timeConverter(elapsedtime), 25, '▬', ':blue_circle:').toString()

        if (server_queue.songs.length < 2) {

            let queue1 = new Discord.MessageEmbed()
                .setAuthor(`${message.guild.name}`, message.guild.iconURL({ dynamic: true }))
                .setColor(roleColor(message))
                .setTitle(`${server_queue.songs[0].title}`)
                .setURL(server_queue.songs[0].customurl)
                .setDescription(`<@${server_queue.songs[0].addedid}> added from **${server_queue.songs[0].app}**\n
                ${elapsedtime}<:transparent:890623794421592104>${splitbar(bar)}<:transparent:890623794421592104>${totaltime}`)
            message.channel.send({ embeds: [queue1] })


        } else if (server_queue.songs.length < 11) {

            let string = ''
            let index = 1

            string += `${server_queue.songs.slice(1, 11).map(x => `**#${index++}** [${x.title}](${x.customurl})`).join("\n")}`

            let npp = `**[${server_queue.songs[0].title}](${server_queue.songs[0].customurl})**\n
            <@${server_queue.songs[0].addedid}> added from **${server_queue.songs[0].app}**\n
            ${elapsedtime}<:transparent:890623794421592104>${splitbar(bar)}<:transparent:890623794421592104>${totaltime}`

            let queue1 = new Discord.MessageEmbed()
                .setAuthor(`${message.guild.name}`, message.guild.iconURL({ dynamic: true }))
                .setTitle('In Queue')
                .setDescription(`${string}`)
                .setColor(roleColor(message))
                //
                .addField(`Now Playing`, `${npp}`)
                message.channel.send({ embeds: [queue1] })
                
        } else if(server_queue.songs.length > 11){
            let string = ''
            let index = 1

            string += `${server_queue.songs.slice(1, 11).map(x => `**#${index++} |** [${x.title}](${x.customurl})`).join("\n")}\nmore **__${server_queue.songs.length-11} songs__** from queue\n`

            let npp = `**[${server_queue.songs[0].title}](${server_queue.songs[0].customurl})**\n
            <@${server_queue.songs[0].addedid}> added from **${server_queue.songs[0].app}**\n
            ${elapsedtime}<:transparent:890623794421592104>${splitbar(bar)}<:transparent:890623794421592104>${totaltime}`

            let queue1 = new Discord.MessageEmbed()
                .setAuthor(`${message.guild.name}`, message.guild.iconURL({ dynamic: true }))
                .setTitle('In Queue')
                .setDescription(`${string}`)
                .setColor(roleColor(message))
                //
                .addField(`Now Playing`, `${npp}`)
                message.channel.send({ embeds: [queue1] })
        }

    }
}

function formatTime(time) {
    return time < 10 ? `0${time}` : time;
}

function timeConverter(timestamp) {
    const split = timestamp.split(':')

    if (split.length > 2) {

        let [hour, minute, second] = split;

        return hour * 3600 + minute * 60 + second * 1
    } else {

        let [minute, second] = split;

        return (minute * 60 + second * 1)

    }
}

function splitbar(bar) {
    const split = bar.split(',');

    let [part] = split;

    return part
}