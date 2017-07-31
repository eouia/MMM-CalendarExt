const EventEmitter = require('events').EventEmitter
const Pubsub = new EventEmitter()

Pubsub.on('uncaughtException', function (err) {
  console.log('EventEmitter exception')
  console.error(err)
})

module.exports = Pubsub
