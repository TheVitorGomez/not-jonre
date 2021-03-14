import discord from 'discord.js'
import ytdl, { getInfo } from 'ytdl-core'
import { messageEmbed } from './views/MessageEmbed'

require('dotenv').config()

const client = new discord.Client()
const queue = new Map()

client.once('ready', () => {
  console.log(`Logged in with ${client.user?.tag}!`)
})
client.once('reconnecting', () => {
  console.log('Reconnecting!')
})
client.once('disconnect', () => {
  console.log('Disconnect!')
})

const userID = [
  '232255292790800385',
  '393828293687771138',
  '260832826327433227',
  '373200918239510549',
  '330481929067560970',
  '232198642990186497',
  '394450470686687252',
  '324994718507204608',
  '273447946912006145',
  '361561632322879494',
]

client.on('message', async (msg: any) => {
  if (msg.author.bot) return
  if (!msg.content.startsWith(process.env.PREFIX)) return

  if (msg.content === `${process.env.PREFIX}salve`) {
    msg.channel.send(
      `Salve, <@${userID[Math.floor(Math.random() * userID.length)]}>!`
    )
  }
})

client.on('message', async (msg: any) => {
  if (msg.author.bot) return
  if (!msg.content.startsWith(process.env.PREFIX)) return

  if (msg.content === `${process.env.PREFIX}help`) {
    return msg.channel.send(messageEmbed)
  }
})

client.on('message', async (msg: any) => {
  if (msg.author.bot) return
  if (!msg.content.startsWith(process.env.PREFIX)) return

  const serverQueue = queue.get(msg.guild?.id)

  if (msg.content.startsWith(`${process.env.PREFIX}play`)) {
    execute(msg, serverQueue)
  } else if (msg.content.startsWith(`${process.env.PREFIX}skip`)) {
    skip(msg, serverQueue)
  } else if (msg.content.startsWith(`${process.env.PREFIX}stop`)) {
    stop(msg, serverQueue)
  }
})

// Função de entrar no canal de voz e tocar alguma música
async function execute(message: any, serverQueue: any) {
  const args = message.content.split(' ') // Divide o conteúdo da mensagem

  // Pega o canal de voz de quem digitou e verifica se o autor está conectado em um
  const voiceChannel = message.member.voice.channel
  if (!voiceChannel) {
    return message.channel.send(
      'Você precisa estar em um canal de voz para eu conseguir entrar!'
    )
  }

  // Verifica se o bot tem permissão para entrar no canal de voz
  const permissions = voiceChannel.permissionsFor(message.client.user)
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return message.channel.send(
      'Eu preciso de permissão para entrar e falar no seu canal de voz!'
    )
  }

  const songInfo = await getInfo(args[1]) // Pega a segunda informação da mensagem
  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url,
  }

  if (!serverQueue) {
    // Creating the contract for our queue
    const queueContract = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    } as any

    // Setting the queue using our contract
    queue.set(message.guild.id, queueContract)
    // Pushing the song to our songs array
    queueContract.songs.push(song)

    try {
      // Here we try to join the voicechat and save our connection into our object.
      const connection = await voiceChannel.join()
      queueContract.connection = connection
      // Calling the play function to start a song
      play(message.guild, queueContract.songs[0])
    } catch (err) {
      // Printing the error message if the bot fails to join the voicechat
      console.log(err)
      queue.delete(message.guild.id)
      return message.channel.send(err)
    }
  } else {
    serverQueue.songs.push(song)
    console.log(serverQueue.songs)
    return message.channel.send(`${song.title} está na fila!`)
  }
}

function skip(message: any, serverQueue: any) {
  if (!message.member.voice.channel)
    return message.channel.reply(
      'Você precisa estar em um canal de voz para pular a música!'
    )
  if (!serverQueue)
    return message.channel.send('Não tem nenhuma música para pular')
  serverQueue.connection.dispatcher.end()
}

function stop(message: any, serverQueue: any) {
  if (!message.member.voice.channel) {
    return message.reply(
      'Você precisa estar em um canal de voz para parar a música!'
    )
  }

  if (!serverQueue) {
    return message.reply('Não tem nenhuma música para parar')
  }

  serverQueue.songs = []
  serverQueue.connection.dispatcher.end()
}

function play(guild: any, song: any) {
  const serverQueue = queue.get(guild.id)
  if (!song) {
    serverQueue.voiceChannel.leave()
    queue.delete(guild.id)
    return
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on('finish', () => {
      serverQueue.songs.shift()
      play(guild, serverQueue.songs[0])
    })
    .on('error', (error: any) => console.error(error))
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
  serverQueue.textChannel.send(`Tocando: **${song.title}**`)
}

client.login(process.env.TOKEN)
