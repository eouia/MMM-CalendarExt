var Calendar = require('./Calendar.js')
var Pubsub = require('./Pubsub.js')

function Calendars() {
  this.calendars = []
}

Calendars.prototype.getAllEvents = function() {
  var eArray = []

  for (var i in this.calendars) {
    var tArray = []
    var c = this.calendars[i]
    tArray = eArray
    eArray = tArray.concat(c.getAllEvents())
  }
  return eArray
}

Calendars.prototype.has = function(calendar) {
  if (!(calendar instanceof Calendar)) {
    throw new Error('Invalid Calendar object.')
  }
  return
  (typeof this.calendar[calendar.uid] !== 'undefined') ? 1 : 0
}

Calendars.prototype.resetCalendars = function() {
  this.calendars.forEach(function(c) {
    c.suicide()
  })
  this.calendars = []
  Pubsub.emit('ALL_CALENDARS_RESET')
}

Calendars.prototype.registerCalendar = function(calConfig, sender, autoStart) {
  if (typeof autoStart === 'undefined') { autoStart = 0; }
  var calendar = new Calendar(calConfig, sender, autoStart)
  calendar.sender = sender
  if (this.has(calendar)) {
    // do duplicate register;
  } else {
    this.calendars[calendar.uid] = calendar
  }
  return calendar.uid
}


exports = module.exports = Calendars
