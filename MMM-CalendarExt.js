//@FIXME self hide and show by profile makes me crazy. I use ugly method, but it works. someday I'll fix it.
//@TODO I should make refactoring, there are too many garbage codes and duplicates.
//


Module.register("MMM-CalendarExt", {
  events: [],
  instantEvents: [],
  CurrentConfigs: {},

  getScripts: function () {
    return ["moment.js", 'Configs.js', 'Render.js']
  },

  getStyles: function () {
    return ["font-awesome.css", "custom.css", "preset.css"]
  },

  getCommands: function(register) {
    if (register.constructor.name == 'TelegramBotCommandRegister') {
      register.add({
        command: 'whennext',
        description : 'Show next event has title. You can try like this; `/whennext birthday`',
        callback : 'TLGBOT_skd',
        args_pattern : [/[^\s]+/i],
        args_mapping : ["title"]
      })
      register.add({
        command: 'skd',
        description : 'Find upcoming schedules with specific date, calendar name and profile.\nSee more help with `/skd`',
        callback : 'TLGBOT_skd',
        args_pattern: [/d:[^ ,]+/i, /c:[^ ,]+/, /p:[^ ,]+/, /n:[0-9]+/],
        args_mapping: ["date", "calendar", "profile", "count"]
      })
    }

  },

  TLGBOT_skd: function (command, handler) {
    var helptext = "Find upcoming schedules with specific date, calendar name and profile.\n"
      + "You can use these parameters seperated by space;\n"
      + "`n:` - counts of events\n"
      + "   maximum 10\n"
      + "   default : 5\n"
      + "`c:` - name of calendar\n"
      + "`p:` - profile of calendar\n"
      + "`d:` - period of calendar\n"
      + "   today, tomorrow, thisw, nextw, thism, nextm\n"
      + "   sun, mon, tue, wed, thu, fri, sat\n"
      + "   default: today\n"
      + "e.g. `/skd p:John d:nextm`\n"
    var text = ""
    var filter = {
      profiles: [],
      names: [],
      titlePattern: "",
      from: moment().startOf('day').format('x'),
      to: moment().endOf('day').format('x'),
      count: 5
    }
    if (command == 'whennext') {
      helptext = "You should use this command with title text like this; `/whennext birthday`"
    }
    var args = handler.args
    if (args == null) {
      handler.reply("TEXT", helptext, {parse_mode:'Markdown'})
      return
    }
    var date = (args.date) ? args.date.substring(2) : null
    var calendar = (args.calendar) ? [args.calendar.substring(2)] : []
    var profile = (args.profile) ? [args.profile.substring(2)] : []
    var count = (args.counts) ? args.counts.substring(2) : 5
    filter.profile = profile
    filter.name = calendar
    filter.count = count
    var todayN = moment().isoWeekday()
    var dayN
    switch (date) {
      case 'tomorrow':
        filter.from = moment().add(1, 'days').startOf('day').format('x')
        filter.to = moment().add(1, 'days').endOf('day').format('x')
        break;
      case 'thisw':
        filter.from = moment().startOf('week').format('x')
        filter.to = moment().endOf('week').format('x')
        break;
      case 'nextw':
        filter.from = moment().add(1, 'weeks').startOf('week').format('x')
        filter.to = moment().add(1, 'weeks').endOf('week').format('x')
        break;
      case 'thism':
        filter.from = moment().startOf('month').format('x')
        filter.to = moment().endOf('month').format('x')
        break;
      case 'nextm':
        filter.from = moment().add(1, 'months').startOf('month').format('x')
        filter.to = moment().add(1, 'months').endOf('month').format('x')
        break;
      case 'mon':
        dayN = (todayN >= 1) ? 8 : 1
        filter.from = moment().isoWeekday(dayN).startOf('day').format('x')
        filter.to = moment().isoWeekday(dayN).endOf('day').format('x')
        break;
      case 'tue':
        dayN = (todayN >= 2) ? 9 : 2
        filter.from = moment().isoWeekday(dayN).startOf('day').format('x')
        filter.to = moment().isoWeekday(dayN).endOf('day').format('x')
        break;
      case 'wed':
        dayN = (todayN >= 3) ? 10 : 3
        filter.from = moment().isoWeekday(dayN).startOf('day').format('x')
        filter.to = moment().isoWeekday(dayN).endOf('day').format('x')
        break;
      case 'thu':
        dayN = (todayN >= 4) ? 11 : 4
        filter.from = moment().isoWeekday(dayN).startOf('day').format('x')
        filter.to = moment().isoWeekday(dayN).endOf('day').format('x')
        break;
      case 'fri':
        dayN = (todayN >= 5) ? 12 : 5
        filter.from = moment().isoWeekday(dayN).startOf('day').format('x')
        filter.to = moment().isoWeekday(dayN).endOf('day').format('x')
        break;
      case 'sat':
        dayN = (todayN >= 6) ? 13 : 6
        filter.from = moment().isoWeekday(dayN).startOf('day').format('x')
        filter.to = moment().isoWeekday(dayN).endOf('day').format('x')
        break;
      case 'sun':
        dayN = (todayN >= 7) ? 14 : 7
        filter.from = moment().isoWeekday(dayN).startOf('day').format('x')
        filter.to = moment().isoWeekday(dayN).endOf('day').format('x')
        break;
    }
    if (command == 'whennext') {
      filter.to = moment().add(6, 'months').endOf('day').format('x')
      filter.titlePattern = (args.title) ? args.title : ""
      filter.count = 1
    }
    var events = this.findSchedule(filter, null, null)
    if (events.events.length <= 0) {
      text = "I cannot find any schedule which you described. Try another."
      handler.reply("TEXT", text)
    } else {
      var sd = (events.events.length == 1) ? 1 : 0
      events.events.forEach((e)=> {
        var title = (e.title) ? e.title : " "
        var location = (e.location) ? e.location : " "
        var description = (e.description && sd) ? e.description : " "
        var time = (e.startDate) ? moment(parseInt(e.startDate)).format("MMM D, HH:mm:ss") : " "
        text += "*" + title + "*\n"
        text += "`" + time + "`\n"
        text += "_" + location + "_\n\n"
        text += description + "\n"
      })
      handler.reply("TEXT", text, {parse_mode:'Markdown'})
    }
  },

  start: function() {
    this.observer = null
    this.isInit = 0
    this.redrawTimer = null
    this.profileSet = new Set()
    this.nameSet = new Set()
  },

  suspend: function() {
    if (typeof R !== 'undefined' && this.isInit !== 0) {
      R.hide()
      this.draw()
    }
  },

  resume: function() {
    if (typeof R !== 'undefined' && this.isInit !== 0) {
      R.show()
      this.draw()
    }
  },

  addCalendars: function() {
    var self = this
    for (var c in this.CurrentConfigs.calendars) {
      self.addCalendar(self.CurrentConfigs.getCalConfig(c))
    }
  },

  resetCalendars: function() {
    this.events=[];
    this.sendSocketNotification("RESET_CALENDARS")
  },

  addCalendar: function (calendar, sender = 'calext', reqKey = null) {
    calendar.sender = sender
    this.sendSocketNotification(
      "ADD_CALENDAR",
      {
        'calendar': calendar,
        'sender': sender,
        'reqKey': reqKey
      }
    )
  },

  getDom: function() {
    if (this.isInit) {
      R = new Render ()
      R.drawViews(
        this.CurrentConfigs,
        this.getEventsToDraw()
      )
    }
    var wrapper = null
    wrapper = document.createElement("div")
    wrapper.id = 'CALEXT_proxy'
    wrapper.className = 'proxy'
    return wrapper
  },

  getEventsToDraw: function() {
    var locale = this.CurrentConfigs.system.locale
    var profile = this.profile
    var views = this.CurrentConfigs.system.show
    var oldLimit = moment().locale(locale).add(-1,'days').endOf('day')
    var self = this
    this.instantEvents = this.instantEvents.filter(function (e) {
      var uid = e.uid.split('@')[0]
      var msg = {
        message : "",
        uid : uid,
        sessionId : null,
        sender: e.sender,
      }
      var valid = moment(e.endDate).locale(locale).isAfter(oldLimit)
      if(!valid) {
        msg.message = e.uid
        self.sendNotification('CALEXT_SAYS_USELESS_EVENT_REMOVED', msg)
      }
      return valid
    })
    var eArr = []
    eArr = eArr.concat(this.events, this.instantEvents)
    var isForAnyone = (self.profile == null || self.profile == '') ? 1 : 0
    var isForAnyView = (views.length > 0) ? 0 : 1
    if (!isForAnyone) {
      eArr = eArr.filter(function(e) {
        if (e.profiles.length > 0) { // is this event dedicated to some profiles?
          if(e.profiles.indexOf(self.profile) >= 0) { //Is my profile in event profiles?
            return 1 // Yes, my profile is in this event
          } else {
            return 0 // No, my profile is not in this event
          }
        } else {
          return 1 //this event is for all
        }
      })
    }
    if (!isForAnyView) {
      eArr = eArr.filter(function(e) {
        var eSet = new Set(e.views)
        var vSet = new Set(views)
        if (eSet.size > 0) { //is this event dedicated to some views?
          let intersection = new Set([...eSet].filter(x => vSet.has(x)));
          if (intersection.size > 0) { //is any views in event views?
            return 1 // Yes some views belong to event views
          } else {
            return 0 //No, there is no views belong to event
          }
        } else {
          return  1 //No, this event is for all view
        }
      })
    }
    /*
    eArr.sort(function(a, b) {
      if (a.fullDayEvent !== b.fullDayEvent) {
        return b.fullDayEvent - a.fullDayEvent
      } else {
        if (a.startDate == b.startDate) {
          return (a.name > b.name)
        } else {
          return a.startDate - b.startDate
        }
      }
    })
    */
    return eArr
  },

  removeInstantEvent: function(eventUid, senderName, sessionId) {
    var msg = {
      message : "",
      sessionId : sessionId,
      uid : null,
      sender : senderName
    }
    var originIndex = this.instantEvents.length
    var uid = ((eventUid) ? eventUid : sessionId) + '@' + senderName
    var self = this
    var chkFlag = 0
    this.instantEvents = this.instantEvents.filter(function (e) {
      var valid = (e.sender != senderName) || (e.uid != uid)
      if(!valid) {
        msg.message = 'EVENT_REMOVED'
        msg.uid = e.uid
        self.sendNotification('CALEXT_SAYS_REMOVE_EVENT_RESULT', msg)
        chkFlag = 1
      }
      return valid
    })
    if (!chkFlag) {
      msg.message = 'EVENT_NOT_REMOVED_UID_FAIL'
      msg.uid = eventUid
      this.sendNotification('CALEXT_SAYS_REMOVE_EVENT_RESULT', msg)
    } else {
      this.draw()
    }
  },

  addInstantEvent: function(ev, senderName, sessionId) {
    var redraw = 0
    var msg = {
      uid: null,
      message : "",
      sessionId : sessionId,
      sender : senderName
    }
    if(this.instantEvents.filter(function (e) {
      return ev.sender == senderName
    }).length >= 100) {
      msg.message = 'TOO_MANY_EVENTS'
      this.sendNotification('CALEXT_SAYS_ADD_EVENT_RESULT', msg)
    }
    var curCfg = this.CurrentConfigs
    if(typeof curCfg == 'undefined') {
      msg.uid = ev.uid
      msg.message = 'NOT_READY_YET'
      this.sendNotification('CALEXT_SAYS_ADD_EVENT_RESULT', msg)
      return
    }
    var eDefault = {
      sender:null,
      uid: null,
      name: senderName,
      profiles: [],
      views: [],
      ellipsis: 0,
      symbolPattern: [],
      symbolPatternWhere: [],
      classPattern: [],
      classPatternWhere: [],
      styleName: curCfg.defaultCalendar.styleName,
      symbol: curCfg.defaultCalendar.symbol,
      title: null,
      description: null,
      location: null,
      geo: null,
      startDate: moment().valueOf(),
      endDate: moment().valueOf(),
      fullDayEvent: 0,
    }
    for(var param in eDefault) {
      if (typeof ev[param] === 'undefined') {
        ev[param] = eDefault[param]
      }
    }
    var tuid = (ev.uid) ? ev.uid : sessionId
    msg.uid = tuid
    ev.uid = (tuid + '@' + senderName).toString()
    ev.sender = senderName
    var eArr = this.instantEvents.filter(function (e) {
      return (e.sender == senderName) && (e.uid == ev.uid)
    })
    var eOrigin = (eArr.length == 1) ? eArr[0] : null
    if (!eOrigin) {
      this.instantEvents.push(ev)
      msg.message = 'EVENT_ADDED'
      this.sendNotification('CALEXT_SAYS_ADD_EVENT_RESULT', msg)
      redraw = 1
    } else {
      var chkChng = 0
      for(var param in eOrigin) {
        if (typeof ev[param] !== 'undefined') {
          if (ev[param] !== eOrigin[param]) {
            eOrigin[param] = ev[param]
            chkChng = 1
          }
        } else {
          //leave origin
        }
      }
      if (chkChng) {
        msg.message = 'EVENT_UPDATED'
        this.sendNotification('CALEXT_SAYS_ADD_EVENT_RESULT', msg)
        redraw = 1
      } else {
        msg.message = 'EVENT_NOT_UPDATED'
        this.sendNotification('CALEXT_SAYS_ADD_EVENT_RESULT', msg)
      }
    }
    if (redraw) {
      this.draw()
    }
  },

  makeIndex: function() {
    var events = this.events.concat(this.instantEvents)
    var profileSet = new Set()
    var nameSet = new Set()
    events.forEach((e)=>{
      if(e.profiles.length > 0) {
        var epf = new Set(e.profiles)
        profileSet = new Set([...profielSet, ...epf])
      }
      if(e.name) nameSet.add(e.name)
    })
    this.profileSet = profileSet
    this.nameSet = nameSet
  },

  findSchedule(filter, senderName, sessionId) {
    var events = this.events.concat(this.instantEvents)
    var final = events.filter(function(e){
      if (filter.profiles.length > 0) {
        if (e.profiles.length > 0) {
          if (
            e.profiles.filter(function(ep){
              return (filter.profiles.indexOf(ep) >= 0) ? 1 : 0
            }).length > 0
          ) {
              //in filter
          } else {
            return 0
          }
        }
      }
      if (filter.names.length > 0) {
        if (e.name) {
          if (filter.names.indexOf(e.name) < 0) {
            return 0
          } else {
            //in filter
          }
        } else {
          return 0
        }
      }
      if (
        moment(parseInt(e.startDate)).isBefore(moment(parseInt(filter.from)))
      ) {
        return 0
      }
      if (
        moment(parseInt(e.startDate)).isAfter(moment(parseInt(filter.to)))
      ) {
        return 0
      }
      if(filter.titlePattern) {
        var pattern = filter.titlePattern
        var r = (pattern instanceof RegExp) ? pattern : pattern.toRegexp()
        if (!e.title.match(r)) return 0;
      }
      return 1
    }).sort(function(a,b){
      return a.startDate - b.startDate
    }).slice(0, filter.count)

    var cleanedEvents = []
    for (var i=0; i<final.length; i++) {
      cleanedEvents.push({
        name: final[i].name,
        fullDayEvent: final[i].fullDayEvent,
        styleName : final[i].styleName,
        symbol: final[i].symbol,
        title: final[i].title,
        description: final[i].description,
        location: final[i].location,
        geo: final[i].geo,
        startDate: final[i].startDate,
        endDate: final[i].endDate
      })
    }

    var msg = {
      message : "",
      sessionId : sessionId,
      sender : senderName,
      filter: filter
    }

    if (final.length > 0) {
      msg.message = "SCHEDULE_FOUND"
      msg.events = cleanedEvents
    } else {
      msg.message = "SCHEDULE_NOTFOUND"
      msg.events = []
    }
    return msg
  },

  saySchedule(filterOrigin, senderName, sessionId) {
    var filter ={}
    var filterDefault = {
      profiles: [],
      names: [],
      titlePattern: "",
      from: moment().format('x'),
      to: moment().add(2, 'days').format('x'),
      count: 10
    }

    for(var param in filterDefault) {
      if (typeof filterOrigin[param] === 'undefined') {
        filter[param] = filterDefault[param]
      } else {
        filter[param] = filterOrigin[param]
      }
    }

    var msg = this.findSchedule(filter, senderName, sessionId)


    this.sendNotification('CALEXT_SAYS_SCHEDULE', msg)
  },

  notificationReceived: function(notification, payload, sender) {
    var sessionId = moment().valueOf()
    if (typeof payload !== 'undefined' && payload !== null) {
      if (typeof payload.sessionId !== 'undefined') {
        sessionId = payload.sessionId
      }
    }
    switch (notification) {
      case 'DOM_OBJECTS_CREATED':
        if(typeof sender == 'undefined') {
          this.loadCSS()
          this.initAfterLoading()
        }
        break
      case 'CHANGED_PROFILE':
        this.showing = 0
        this.isInit = 0
        this.initAfterLoading(payload.to)
        this.sendNotification('CALEXT_SAYS_PROFILE_CHANGED', payload)
        break
      case 'CALEXT_ADD_EVENT':
        if(typeof payload.event !== 'undefined') {
          this.addInstantEvent(payload.event, sender.name, sessionId)
        }
        break
      case 'CALEXT_REMOVE_EVENT':
        if(typeof payload.uid !== 'undefined') {
          this.removeInstantEvent(payload.uid, sender.name, sessionId)
        }
        break
      case 'CALEXT_TELL_SCHEDULE':
        if(typeof payload.filter !== 'undefined') {
          this.saySchedule(payload.filter, sender.name, sessionId)
        }
        break
      case 'CALEXT_MODIFY_CONFIG':
        this.modifyConfiguration(payload.config, sender.name, sessionId)
    }
  },

  socketNotificationReceived: function(notification, payload) {
    switch (notification) {
      case 'CALENDAR_MODIFIED':
        this.sendNotification("CALEXT_SAYS_CALENDAR_MODIFIED")
        this.events = payload
        this.makeIndex()
        this.draw()

        break
      case 'READY_TO_ADD_CALENDAR':
        this.addCalendars()
        break;
      }
  },

  modifyConfiguration: function(newCfg, senderName, sessionId) {
    this.CurrentConfigs = this.CurrentConfigs.modify(newCfg)
    var needReloadCalendar = 1
    var msg = {
      sessionId : sessionId,
      sender : senderName,
    }
    if (this.CurrentConfigs.system.useProfileConfig) {
      if (typeof this.CurrentConfigs.profileConfigs !== 'undefined') {
        if (typeof this.CurrentConfigs.profileConfigs[this.profile] !== 'undefined') {
          this.CurrentConfigs
            = new Configs().make(this.CurrentConfigs.profileConfigs[this.profile])
        }
      }
    } else {
      needReloadCalendar = 0
    }
    if(typeof newCfg.calendars !== 'undefined' && newCfg.calendars.length > 0) {
      needReloadCalendar = 1
    }
    if(needReloadCalendar) {
      this.events = []
      this.resetCalendars()
      this.sendNotification('CALEXT_SAYS_READY', null)
    }
    this.isInit = 1
    this.draw()
    this.sendNotification('CALEXT_SAYS_CONFIG_MODIFIED', msg)
  },

  initAfterLoading: function(profile="") {
    var self = this
    var needReloadCalendar = 1
    this.CurrentConfigs = new Configs().make(this.config)
    //if(profile == 'User2') debugger;
    if(!profile) {
      this.profile = this.CurrentConfigs.system.startProfile
    } else {
      this.profile = profile
    }
    if (this.CurrentConfigs.system.useProfileConfig) {
      if (typeof this.CurrentConfigs.profileConfigs !== 'undefined') {
        if (typeof this.CurrentConfigs.profileConfigs[this.profile] !== 'undefined') {
          this.CurrentConfigs
            = new Configs().make(this.CurrentConfigs.profileConfigs[this.profile])
        }
      }
    } else {
      if(profile) {
        needReloadCalendar = 0
      }
    }
    if(needReloadCalendar) {
      this.events = []
      this.resetCalendars()
      this.sendNotification('CALEXT_SAYS_READY', null)
    }
    this.isInit = 1
  },

  loadCSS: function() {
    var css = [
      {
        id:'materialDesignIcons',
        href: 'https://cdn.materialdesignicons.com/2.0.46/css/materialdesignicons.min.css',
      },
      {
        id:'emojiCss',
        href: 'https://afeld.github.io/emoji-css/emoji.css'
      },
      {
        id:'flag-icon-CSS',
        href: 'https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/2.8.0/css/flag-icon.min.css'
      }
    ]
    css.forEach(function(c) {
      if (!document.getElementById(c.id))
      {
        var head  = document.getElementsByTagName('head')[0]
        var link  = document.createElement('link')
        link.id   = c.id
        link.rel  = 'stylesheet'
        link.type = 'text/css'
        link.href = c.href
        link.media = 'all'
        head.appendChild(link)
      }
    })
  },

  draw: function() {
    if(!this.isInit) return
    var target = document.getElementsByClassName('MMM-CalendarExt')
    if (target.length > 0) {
      if (target[0].style.position == "fixed") {
        return
      }
    }
    this.updateDom()
    var self = this
    clearInterval(this.redrawTimer)
    this.redrawTimer = null
    var redrawInterval = null
    if (typeof this.CurrentConfigs !== 'undefined') {
      redrawInterval = this.CurrentConfigs.system.redrawInterval
    }
    if (redrawInterval < 60000) {
      redrawInterval = 60000
    }
    this.redrawTimer = setInterval(function() {
      self.draw()
    }, redrawInterval)
  },
})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
