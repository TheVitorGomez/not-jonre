import discord from 'discord.js'

const randomColor = Math.floor(Math.random() * 16777215).toString(16)

const messageEmbed = new discord.MessageEmbed()
  .setColor(`#${randomColor}`)
  .setAuthor(
    'NotJonre',
    'https://i.imgur.com/IsiApBF.jpg',
    'https://www.pornhub.com'
  )

export { messageEmbed }
