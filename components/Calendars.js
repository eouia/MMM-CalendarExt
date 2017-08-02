var Calendar = require('./Calendar.js')
var Pubsub = require('./Pubsub.js')

class Calendars {
  constructor () {
    this.calendars = []
  }

  getAllEvents () {
    var eArray = []

    for (var i in this.calendars) {
      var tArray = []
      var c = this.calendars[i]
      tArray = eArray
      eArray = tArray.concat(c.getAllEvents())
    }
    return eArray
  }

  has (calendar) {
    if (!(calendar instanceof Calendar)) {
      throw new Error('Invalid Calendar object.')
    }
    return
    (typeof this.calendar[calendar.uid] !== 'undefined') ? 1 : 0
  }

  resetCalendars() {
    console.log("Calendars.js::resetCalendars()")
    this.calendars = []
    console.log('resetted???')
    Pubsub.emit('ALL_CALENDARS_RESET')
  }

  registerCalendar (calConfig, sender, autoStart = 0) {
    var calendar = new Calendar(calConfig, sender, autoStart)
    calendar.sender = sender
    if (this.has(calendar)) {
            // do duplicate register;
    }
    this.calendars[calendar.uid] = calendar
    return calendar.uid
  }
}

exports = module.exports = Calendars
