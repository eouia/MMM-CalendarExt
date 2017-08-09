String.prototype.hashCode = function() {
  var hash = 0, i, chr
  if (this.length === 0) return hash
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i)
    hash  = ((hash << 5) - hash) + chr
    hash |= 0; // Convert to 32bit integer
  }
  return String((hash >>> 0))
}

var iCal = require('../vendor/ical.js')
//var iCal = require('ical')
//var iCal = require('./ical.js')
var moment = require('moment')
var Pubsub = require('./Pubsub.js')

function Calendar (calConfig, sender=null, autostart=0) {
  this.type = 'static'
  this.autostart = autostart
  this.sender = sender
  this.config = calConfig
  this.name = this.config.name
  this.timestamp = moment().format('x')
  this.timer = null
  //this.replace = null

  this.status = {
    state : 'not fetched yet',
    lastFetchedTime : null,
    lastFetchedEvents : null,
    lastFetchedOldEvents : null,
    lastServedEvents : null,
    error: null
  }
/*
  if(typeof this.config.replace === 'undefined') {
    this.replace = []
  } else {
    this.replace = this.config.replace
  }
*/
  this.httpUrl = this.config.url.replace("webcal://", "http://")
  this.opts = null

  var nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1])
  this.opts = {
    "headers" : {
      "User-Agent":
        "Mozilla/5.0 (Node.js "
        + nodeVersion + ") MagicMirror/"
        + global.version
        + " (https://github.com/MichMich/MagicMirror/)"
    }
  }
  if (this.config.auth) {
    if(this.config.auth.method === "bearer"){
      this.opts.auth = {
        bearer: this.config.auth.pass
      }
    } else {
      this.opts.auth = {
        user: this.config.auth.user,
        pass: this.config.auth.pass
      }
      if(this.config.auth.method === "digest"){
        this.opts.auth.sendImmediately = 0
      }else{
        this.opts.auth.sendImmediately = 1
      }
    }
  }

  this.uid = (this.sender + this.name + this.httpUrl).hashCode()
  this.events = []
  //this.events = new CalendarEvents(this.config.maxEntries, this.uid)

  //this.fetcher = new Fetcher(this)
  if (autostart) {
    this.fetch()
    this.activate()
  }
}
Calendar.prototype.fetch = function() {
  console.log("[CALEXT]",this.httpUrl, " >> Fetch starts.")
  var self = this
  self.status.state = 'fetching'

  iCal.fromURL(this.httpUrl, this.opts, function(err, data) {
    if (err) {
      console.log('Error in iCal Parsing.')
      console.log(self.opts)
      console.log(err)
      self.nonewEvents([])
      return
    }
    var events = []
    var oldEvents = []
    var eventDate = function(event, time) {
      return (event[time].length === 8)
        ? moment(event[time], "YYYYMMDD").startOf('day')
        : moment(event[time])
    }
    var now = moment()
    var today = moment().startOf("day")
    var past = moment().startOf('month').startOf('week').startOf('day')
    var future = moment().add(self.config.maxDays - 1, "days").endOf("day")

    // parsed item iteration
    for (var e in data) {
      var event = data[e]
      //var now = moment()
      //var today = moment().startOf('day')
      var title = "Unkonwn Event"
      var description = ""
      var location = null
      var geo = null
      var uid = null
      var isFulldayEvent = 0
      var startDate = null
      var endDate = null
      // start of VEVENT
      if (event.type === 'VEVENT') {
        if (event.summary) {
          title
            = (typeof event.summary.val !== "undefined")
              ? event.summary.val
              : event.summary
        } else if (event.description) {
          title = event.description
        }

        location = event.location || null
        geo = event.geo || null
        description = event.description || null

        if (!event.uid) {
          uid
            = (title + moment(event.start).format('x')).hashCode()
            + '@' + this.uid
        } else {
            uid = event.uid
        }


        //RRULE exists? It means recurred.
        if (typeof event.rrule !== 'undefined') {
          //recurring; event.endDate is useless.
          var dates = event.rrule.between(
            today.toDate(),
            future.toDate(),
            true,
            function(date, i) {return i < self.config.maxEntries}
          )

          for(var i in dates) {

            var date = dates[i];
            var dt = moment(date)
            if (dt.isBefore(past) || dt.isAfter(future)) {
              return 0
            }

            var endDate = null
            var startDate = moment(dt)
            if (typeof event.duration !== 'undefined') {
              var duration = moment.duration(event.duration)
              endDate = moment(startDate).add(duration)
            } else {
              var duration = event.end - event.start
              endDate = moment(startDate).add(duration, 'ms')
              //isFulldayEvent = 1
            }
            if(
                (startDate.format('HHmmss') == '000000')
                && (endDate.format('HHmmss') == '000000')
            ) {
                isFulldayEvent = 1
            }

            var et = {
              'uid': uid + ':' + i,
              'name': self.name,
              'profiles': self.config.profiles,
              'views': self.config.views,
              'symbol': self.config.symbol,
              'styleName': self.config.styleName,
              'replaceTitle': self.config.replaceTitle,
              'classPattern' : self.config.classPattern,
              'classPatternWhere' : self.config.classPatternWhere,
              'ellipsis': self.config.ellipsis,
              'oneLineEvent': self.config.oneLineEvent,
              'title': title,
              'description': description,
              'location': location,
              'geo': geo,
              'startDate': startDate.format('x'),
              'endDate': endDate.format("x"),
              'fullDayEvent': isFulldayEvent,
              'firstOccurrence': moment(event.start).format('x'),
              'recurred': 1,
              'occurrence': i
            }
            if (startDate.isBefore(now)) {
              oldEvents.push(et)
            } else {
              events.push(et)
            }
          } //iteration of rrule
        //recurred event fetch over
        } else {
          //single
          startDate = moment(event.start)
          if (typeof event.end !== 'undefined') {
            //event.end exists.
            endDate = moment(event.end)
          } else {
            //event.end doesn't exist mean FulldayEvent.
            if (typeof event.duration !== 'undefined') {
              //event.end doesn't exist, but duration exists.
              endDate = moment(startDate).add(moment.duration(event.duration))
            } else {
              //event.end and duration don't exist.
              endDate = moment(startDate)
              isFulldayEvent = 1
            }
          }
          if(
            (startDate.format('HHmmss') == '000000')
            && (endDate.format('HHmmss') == '000000')
          ) {
            isFulldayEvent = 1
          }

          if (startDate.isBefore(past) || endDate.isAfter(future)) {
            continue
          }

          var et = {
            'uid': uid,
            'name': self.name,
            'profiles': self.config.profiles,
            'views': self.config.views,
            'styleName': self.config.styleName,
            'replaceTitle': self.config.replaceTitle,
            'classPattern' : self.config.classPattern,
            'classPatternWhere' : self.config.classPatternWhere,
            'symbol': self.config.symbol,
            'ellipsis': self.config.ellipsis,
            'oneLineEvent': self.config.oneLineEvent,
            'title': title,
            'description': description,
            'location': location,
            'geo': geo,
            'startDate': startDate.format('x'),
            'endDate': endDate.format("x"),
            'fullDayEvent': isFulldayEvent,
            'firstOccurrence': null,
            'recurred': 0,
            'occurrence': 0
          }
          if (startDate.isBefore(now)) {
            oldEvents.push(et)
          } else {
            events.push(et)
          }
          // finish check fulldayevent and parsing startDate, endDate
        }
        // single event fetch over
      }
      // end of 'VEVENT'
      else {
        //console.log(e)
        //do nothing;
      }
      //end of events not 'VEVENT'
    }
    // end of iteration each data

    events.sort(function(a, b) {
      return a.startDate - b.startDate
    })
    self.status.state = 'fetched'
    self.status.lastFetchedTime = moment().format('YY-MM-DD HH:mm:ss')
    self.status.lastFetchedEvents = events.length
    self.status.lastFetchedOldEvents = oldEvents.length
    events = events.slice(0, self.config.maxEntries)
    var finalEvents = events.concat(oldEvents)
    finalEvents.sort(function(a, b) {
      return a.startDate - b.startDate
    })
    self.status.lastServedEvents = finalEvents.length
    if(events !== 'undefined' && finalEvents.length > 0) {
      if(self.isEventsChanged(finalEvents)) {
        self.renewEvents(finalEvents)
        self.status.state = 'renewed'
      } else {
        self.nonewEvents(finalEvents)
        self.status.state = 'fetched but no change'
      }
    }

    console.log("[CALEXT]",self.httpUrl, " >> ")
    console.log(self.status)
  })
  // iCal end.
}
Calendar.prototype.isEventsChanged = function(eArray) {
  if (typeof eArray == 'undefined') return 0
  if (eArray.length <= 0) return 0
  if (this.events.length == 0) return 1
  if (this.events.length !== eArray.length) return 1

  var cIndex = this.events.map(function(e) {return e.uid}).sort()
  var eIndex = eArray.map(function(e) {return e.uid}).sort()

  if (cIndex.length !== eIndex.length) return 1

  for (var i = 0; i < cIndex.length; ++i) {
    if (cIndex[i] !== eIndex[i]) return 1
  }

  for (var i = 0; i < this.events.length; i++) {
    var ce = this.events[i];
    var eA = eArray.filter(function(e) {return (e.uid == ce.uid) ? 1 : 0})

    if (eA.length > 0) var ee = eA[0]
    if (ee.title !== ce.title) return 1
    if (ee.endDate !== ce.endDate) return 1
    if (ee.location !== ce.location) return 1
    if (ee.startDate !== ce.startDate) return 1
    if (ee.description !== ce.description) return 1
  }
  return 0
}
Calendar.prototype.renewEvents = function(eArray) {
  this.events = eArray
  this.timestamp = moment().format('x')
  Pubsub.emit('CALENDAR_MODIFIED')
    //console.log(this.events)
}

Calendar.prototype.nonewEvents = function(eArray) {
  Pubsub.emit('CALENDAR_FETCHED_BUT_NOT_MODIFIED')
}

Calendar.prototype.getAllEvents = function() {
  return this.events
}

Calendar.prototype.suicide = function () {
  this.deactivate()
  this.config = null
  this.events = null
}

Calendar.prototype.activate = function () {
  clearInterval(this.timer)
  var self = this
  this.timer = setInterval(function() {
    self.fetch()
  }, this.config.interval)
}

Calendar.prototype.deactivate = function () {
    clearInterval(this.timer)
    this.timer = null
}

Calendar.prototype.errorCallback = function() {

}

module.exports = Calendar
