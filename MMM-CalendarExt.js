//ToDo
//Command by notification (reset config)
//
String.prototype.trunc = String.prototype.trunc || function(n){
  if (n < 10) return this
  return (this.length > n) ? this.substr(0, n - 1) + '&hellip' : this
}


const SELFNAME = 'calext'

function Configs() {
  this.locale = null
  this.cfg = {}
  this.defaultConfig = {
    system: {
      useProfileConfig: 0,
      startProfile: '',
      showEmptyView: 1,
      show: ['daily'],
      fullDayEventLocalize: 1,
      redrawInterval: 30*60*1000, //minimum 60000
      locale: null,
    },
    views: {
      daily: {
        direction: 'row',
        counts: 5,
        titleFormat: "D",
        overTitleFormat: "MMM D",
        subtitleFormat: "ddd",
      },
      weekly: {
        direction: 'row',
        counts: 4,
        titleFormat: "wo",
        overTitleFormat: "gggg w Week",
        subtitleFormat: "MMM Do",
      },
      monthly: {
        direction: 'row',
        counts: 3,
        titleFormat: "MMMM",
        overTitleFormat: "YYYY MMM",
        subtitleFormat: "YYYY",
      },
      upcoming: {
        title: 'Upcoming',
        limit: 20,
        useRelative: 1
      },
      current: {
        title: 'Current',
        limit: 20,
        useRelative: 1
      },
      month: {
        titleFormat : 'D',
        overTitleFormat : 'MMM D',
        monthTitleFormat: "MMMM",
        weekdayFormat: 'dd',
        showWeeks: 1,
        weeksTitle: 'weeks',
        weeksFormat: 'wo',
      }
    },
    viewGlobal: {
      position: 'bottom_bar',
      positionOrder: -1,
      overflowRolling: 0,
      overflowHeight: 100,
      overflowDuration: 2,
      timeFormat: 'HH:mm',
      dateFormat: "MMM Do",
      fullDayEventDateFormat: "MMM Do",
      ellipsis: 0,
    },
    calendarDefault: {
      name: null,
      profiles: [],
      views: [],
      color: "#CCC",
      inverseColor: "#FFF",
      symbol: "calendar",
      replace: [],
      maxEntries:100,
      maxDays:365,
      interval: 1800000,
      url: null,
      auth: {
        user:"",
        pass:"",
        method:""
      }
    },
  }

  return this;
}
Configs.prototype.mix = function(tmpl, ncfg, includeCalendars=1) {
  var cfg = {}

  var tcfg = (typeof ncfg.system !== 'undefined') ? ncfg.system : {}
  cfg.system = this.assignment({}, tmpl.system, tcfg)
  if(!cfg.system.locale) {
    cfg.system.locale = moment.locale()
  }

  tcfg
    = (typeof ncfg.calendarDefault !== 'undefined')
      ? ncfg.calendarDefault : {}
  cfg.calendarDefault = this.assignment({}, tmpl.calendarDefault, tcfg)

  tcfg = (typeof ncfg.viewGlobal !== 'undefined') ? ncfg.viewGlobal : {}
  cfg.viewGlobal = this.assignment({}, tmpl.viewGlobal, tcfg)

  cfg.views = this.assignment({}, tmpl.views)

  for(p in cfg.views) {
    var newMixed = this.assignment({}, cfg.viewGlobal, cfg.views[p])
    if (typeof ncfg.views !== 'undefined') {
      newMixed
        = (typeof ncfg.views[p] !== 'undefined')
          ? this.assignment({}, cfg.viewGlobal, cfg.views[p], ncfg.views[p])
          : this.assignment({}, cfg.viewGlobal, cfg.views[p])
    }
    cfg.views[p] = newMixed //broaden with viewGlobal
  }
  if (!includeCalendars || typeof ncfg.calendars == 'undefined') return cfg

  cfg.calendars = []
  if(ncfg.calendars.length > 0) {
    var self = this
    ncfg.calendars.forEach(function(c) {
      cfg.calendars.push(self.assignment({}, cfg.calendarDefault, c))
    });
  } else {
    //do nothing
  }
  return cfg
}
Configs.prototype.make = function(newCfg) {
  this.cfg = this.mix(this.defaultConfig, newCfg)
  return this;
}
Configs.prototype.modify = function(newCfg) {
  this.cfg = this.mix(this.cfg, newCfg)
  return this;
}
Configs.prototype.assignment = function (result) {
  var stack = Array.prototype.slice.call(arguments, 1);
  var item;
  var key;
  while (stack.length) {
    item = stack.shift();
    for (key in item) {
      if (item.hasOwnProperty(key)) {
        if (
          typeof result[key] === 'object'
          && result[key]
          && Object.prototype.toString.call(result[key]) !== '[object Array]'
        ) {
          if (typeof item[key] === 'object' && item[key] !== null) {
            result[key] = assignment({}, result[key], item[key]);
          } else {
            result[key] = item[key];
          }
        } else {
          result[key] = item[key];
        }
      }
    }
  }
  return result;
}


function Slots() {
  this.slot = []
}
Slots.prototype.getSlot = function(mode) {
  if (typeof this.slot[mode] !== 'undefined'){
    return this.slot[mode]
  }
}
Slots.prototype.setSlot = function(mode, slot) {
  this.slot[mode] = slot
}
Slots.prototype.prepare = function(mode, cfgMode, locale) {
  var lc = locale
  var cfg = cfgMode
  var template = {
    monthly: {
      p : 'months',
      d : 'month'
    },
    weekly: {
      p : 'weeks',
      d : 'week'
    },
    daily: {
      p : 'days',
      d : 'day'
    },
    month: {
      p : 'days',
      d : 'day'
    }
  }
  var slotIndex = []
  var slot = []
  var counts
  if (typeof cfg.counts !== 'undefined') {
    var counts = cfg.counts
  }
  var start = moment()

  if (mode == 'upcoming' || mode == 'current') counts = 1
  if (mode == 'month') {
    var today = moment().locale(lc)
    var lastMonSlots = today.startOf('month').weekday()
    var thisMonSlots = today.daysInMonth()
    counts = Math.ceil((lastMonSlots + thisMonSlots) / 7) * 7
    start = today.startOf('month').weekday(0).startOf('day')
  }

  start.locale(lc)
  for (i = 0; i <= counts; i++) {
    if (mode == 'upcoming' || mode == 'current') {
      slotIndex.push(start.valueOf())
    } else {
      //daily, weekly, monthly
      slotIndex.push(start.startOf(template[mode].p).valueOf())
    }

    if (i != counts) {
      slot[i] = []
    }
    if (mode == 'upcoming') {
      start.add(100, 'year')
    } else if (mode == 'current'){
      //same
    } else {
      //daily, weekly, monthly
      start.add(1, template[mode].d)
    }
  }
  this.slot[mode] = {
    mode: mode,
    counts: counts,
    slot: slot,
    slotIndex: slotIndex
  }
  return this.slot[mode]
}
Slots.prototype.getAllSlots = function() {
  return this.slot
}
Slots.prototype.resetSlots = function() {
  this.slot=[];
}

function RenderHelper(locale) {
  this.locale = (locale) ? locale : moment.locale()
  return this
}
RenderHelper.prototype.setLocale = function(locale) {
  this.locale = locale
}
RenderHelper.prototype.getMonthDom = function(cfgMonth, slots ,classes) {
  var cfg = cfgMonth
  var showWeeks = cfg.showWeeks
  var lc = this.locale
  var days = []
  var dayNames = []
  var count = 0

  var wrapper = document.createElement("div")
  wrapper.id = SELFNAME + '_month'
  wrapper.className = "wrapper month"
  var monthTitleWrapper = document.createElement("div")
  monthTitleWrapper.className = "monthTitle month_" + moment().format('M')
  monthTitleWrapper.innerHTML
    = moment().startOf('month').format(cfg.monthTitleFormat)

  wrapper.appendChild(monthTitleWrapper)

  if (typeof slots !== 'undefined') {
    for(var i=0; i<7; i++) {
      var tday = moment(slots.slotIndex[i]).locale(lc)
      days.push(tday.format('E'))
      dayNames.push(tday.format(cfg.weekdayFormat))
    }
    var table = document.createElement("table")
    table.className = 'calendarMonth column_' + ((showWeeks) ? 8 : 7)
    var thead = document.createElement('thead')
    thead.className = 'calendarHead'
    var tr = document.createElement('tr')
    tr.className = 'weekHeader'

    if (showWeeks) {
      var th = document.createElement('th')
      th.className = 'weekday_header'
      th.innerHTML = cfg.weeksTitle
      tr.appendChild(th)
    }
    for(var i=0; i<7; i++) {
      var th = document.createElement('th')
      th.className = 'weekday_' + days[i]
      th.innerHTML = dayNames[i]
      tr.appendChild(th)
    }
    thead.appendChild(tr)
    table.appendChild(thead)

    for(i=0; i<slots.slot.length; i++) {
      var events = slots.slot[i]
      var d = moment(slots.slotIndex[i]).locale(lc)
      var now = moment().locale(lc)
      var isThisMonth
        = (now.format('MM') == d.format('MM')) ? 1 : 0

      var isLastMonth
        = (moment(d).startOf('month').isBefore(moment(now).startOf('month')))
          ? 1 : 0
      var isNextMonth
        = (moment(d).startOf('month').isAfter(moment(now).startOf('month')))
          ? 1 : 0
      var isThisWeek = (now.format('wo') == d.format('wo')) ? 1 : 0
      var isToday = (now.format('MMDD') == d.format('MMDD')) ? 1 : 0
      if (i % 7 == 0) {
        var tr = document.createElement('tr')
        tr.className
          = 'weeks weeks_' + moment(d).locale(lc).week()
          + ((isThisWeek) ? ' thisweek' : '')

        if(showWeeks) {
          var th = document.createElement('th')
          th.className = 'weeks_header weeks_' + moment(d).locale(lc).week()
          th.innerHTML = d.format(cfg.weeksFormat)
          tr.appendChild(th)
        }
      }
      var td = document.createElement('td')
      td.className
        = 'day day_' + d.format('d')
        + ' mon_' + d.format('M')
        + ' date_' + d.format('D')
        + ' monDate_' + d.format('MMDD')
        + ' weekday_' + d.format('E')
        + ((isThisMonth) ? ' thismonth' : '')
        + ((isLastMonth) ? ' lastmonth' : '')
        + ((isNextMonth) ? ' nextmonth' : '')
        + ((isToday) ? ' today' : '')

      td.appendChild(this.getHeaderDom('month', cfg, d.valueOf()))
      var mPeriod = slots.slotIndex[i]
      var mPeriodEnd = slots.slotIndex[i + 1]
      if (typeof events !== 'undefined') {
        td.appendChild(
          this.getEventsDom('month', cfg, events, mPeriod, mPeriodEnd)
        )
        count ++
      }

      tr.appendChild(td)
      if (i % 7 == 6) {
        table.appendChild(tr)
      }
    }
    wrapper.appendChild(table)
  }



  var container = document.createElement("div")
  container.className = "CALEXT module module_fake " + classes
  container.id = 'CALEXT_CONTAINER_month'
  container.appendChild(wrapper)
  return container
}
RenderHelper.prototype.getSlotDom = function(mode, cfgMode, slots, classes) {
  var cfg = cfgMode
  var wrapper = document.createElement("div")
  wrapper.id = SELFNAME + '_' + mode
  wrapper.className = "wrapper slots " + mode
  wrapper.style.flexDirection = cfg.direction
  if (typeof slots !== 'undefined') {
    for(i=0; i<slots.slot.length; i++) {
      var events = slots.slot[i]
      var mPeriod = slots.slotIndex[i]
      var mPeriodEnd = slots.slotIndex[i + 1]

      var slotWrapper = document.createElement("div")
      slotWrapper.className = "slot slotid_" + slots.slotIndex[i]

      switch(mode) {
        case 'current':
          slotWrapper.className += ' current'
          break
        case 'upcoming':
          slotWrapper.className += ' upcoming'
          break
        case 'monthly':
          slotWrapper.className += this.monthlyClassName(mPeriod)
          break
        case 'weekly' :
          slotWrapper.className += this.weeklyClassName(mPeriod)
          break
        case 'daily':
        default:
          slotWrapper.className += this.dailyClassName(mPeriod)
          break
      }
      slotWrapper.appendChild(
        this.getHeaderDom(mode, cfg, mPeriod)
      )
      if (typeof events !== 'undefined') {
        slotWrapper.appendChild(
          this.getEventsDom(mode, cfg, events, mPeriod, mPeriodEnd)
        )
      }
      wrapper.appendChild(slotWrapper)
    }
  }

  var container = document.createElement("div")
  container.className = "CALEXT module module_fake " + classes
  container.id = 'CALEXT_CONTAINER_' + mode
  container.appendChild(wrapper)
  return container
}
RenderHelper.prototype.getHeaderDom = function(mode, cfg, d) {
  var lc = this.locale
  var md = moment(parseInt(d)).locale(lc)
  var headerWrapper = document.createElement("div")
  headerWrapper.className = "header"

  var headerTitleWrapper = document.createElement("div")
  headerTitleWrapper.className = "title"

  var headerSubtitleWrapper = document.createElement("div")
  headerSubtitleWrapper.className = "subtitle"

  var title = ""
  var subtitle = ""

  switch(mode) {
    case "current":
    case "upcoming":
      title = cfg.title
      subtitle = ''
      break
    case "monthly":
      title
        = (moment().format('YY') == md.format('YY'))
          ? md.format(cfg.titleFormat)
          : md.format(cfg.overTitleFormat)
      subtitle = md.format(cfg.subtitleFormat)
      break
    case "weekly":
      var nowWeekStr = moment().locale(lc).format('gg')
      var mdWeekStr = moment(md).locale(lc).format('gg')
      title
        = (nowWeekStr == mdWeekStr)
          ? md.format(cfg.titleFormat)
          : md.format(cfg.overTitleFormat)
      subtitle
        = moment(md).locale(lc).startOf('week').format(cfg.subtitleFormat)
        + " - "
        + moment(md).locale(lc).endOf('week').format(cfg.subtitleFormat)
      break
    case "daily":
        subtitle = md.format(cfg.subtitleFormat)
    case "month":
      title
        = (moment().format('MM') == md.format('MM'))
          ? md.format(cfg.titleFormat)
          : md.format(cfg.overTitleFormat)
      break
  }
  headerTitleWrapper.innerHTML = title
  headerSubtitleWrapper.innerHTML = subtitle

  headerWrapper.appendChild(headerTitleWrapper)
  headerWrapper.appendChild(headerSubtitleWrapper)

  return headerWrapper
}
RenderHelper.prototype.getEventsDom = function(mode, cfg, events, s, e) {
  var ms = moment(parseInt(s))
  var me = moment(parseInt(e))

  var eventsBoardWrapper = document.createElement("div")
  eventsBoardWrapper.className = "eventsBoard"

  var eventsWrapper = document.createElement("ul")
  eventsWrapper.className = "events"

  if(Array.isArray(events)) {
    var self = this

    events.sort(function(a,b) {
      if(mode !== 'daily' || mode !== 'month') {
        return ((a.startDate <= b.startDate) ? -1 : 1)
      }
      if (a.fullDayEvent !== b.fullDayEvent) {
        return a.fullDayEvent ? -1 : 1
      } else {
        return ((a.startDate <= b.startDate) ? -1 : 1)
      }
    })
    events.forEach(function(event) {
      var color = event.color
      var eventWrapper = document.createElement("li")
      es = moment(parseInt(event.startDate))
      ee = moment(parseInt(event.endDate))

      var sa = event.symbol.split('@')
      var symbol = sa[0]
      var symbolType = (typeof sa[1] !== 'undefined') ? sa[1] : 'fa'

      eventWrapper.className
        = "event" + " symbol_" + symbol
        + ((es.isBetween(ms, me, null, '[)')) ? " startHere" : "")
        + ((ee.isBetween(ms, me, null, '(]')) ? " endHere" : "")

      for(p in event) {
        if (event[p]) {
          if(Array.isArray(event[p])) {
            if(event[p].length > 0) {
              eventWrapper.dataset[p] = event[p].toString()
            }
          } else {
            eventWrapper.dataset[p] = event[p]
          }
        }
      }

      var symbolWrapper = document.createElement("span")

      if (symbolType == 'md') {
        symbolWrapper.className
          = "google-material-design symbol symbol_" + symbol
        symbolWrapper.innerHTML
          = (mode == 'month')
            ? "<i class='material-icons md-12'>" +symbol + "</i>"
            : "<i class='material-icons'>" +symbol + "</i>"
        symbolWrapper.style.color = event.color
      } else if (symbolType == 'fi') {
        symbolWrapper.className
          = "flag-icon-css symbol symbol_" + symbol
        symbolWrapper.innerHTML
          = "<span class='flag-icon flag-icon-"
          + symbol
          + "'></span>"
      } else if (symbolType == 'em') {
        symbolWrapper.className
          = "emoji symbol symbol_" + symbol
        symbolWrapper.innerHTML
          = "<i class='em em-" +symbol + "'></i>"
        symbolWrapper.style.color = event.color
      } else {
        symbolWrapper.className
          = "fa-stack symbol symbol_" + symbol
        symbolWrapper.innerHTML
          = "<i class='fa fa-circle fa-stack-2x'></i>"
          + "<i class='fa fa-stack-1x fa-inverse fa-"
          + symbol
          + "'></i>"
        symbolWrapper.style.color = event.inverseColor
      }

      var eventContainerWrapper = document.createElement("div")
      eventContainerWrapper.className = "eventContainer"
      var eventTimeWrapper = document.createElement("div")
      eventTimeWrapper.className = "eventTime"
      var eventContentWrapper = document.createElement("div")
      eventContentWrapper.className = "eventContent"
      eventContentWrapper.innerHTML = (event.title).trunc(cfg.ellipsis)
      var eventLocationWrapper = document.createElement("div")
      eventLocationWrapper.className = "eventLocation"
      eventLocationWrapper.innerHTML = event.location ? event.location : ""
      var eventDescriptionWrapper = document.createElement("div")
      eventDescriptionWrapper.className = "eventDescription"
      eventDescriptionWrapper.innerHTML = event.description ? event.description : ""

      if (event.fullDayEvent) {
        eventWrapper.className += " fulldayevent"
        eventWrapper.style.backgroundColor = color
        symbolWrapper.style.color = event.inverseColor
        eventWrapper.style.color = event.inverseColor
      }

      eventTimeWrapper.innerHTML
        = self.eventPeriodString(mode, cfg, event)


      eventContainerWrapper.appendChild(eventTimeWrapper)
      eventContainerWrapper.appendChild(eventContentWrapper)
      eventContainerWrapper.appendChild(eventDescriptionWrapper)
      eventContainerWrapper.appendChild(eventLocationWrapper)


      eventWrapper.appendChild(symbolWrapper)
      eventWrapper.appendChild(eventContainerWrapper)
      eventsWrapper.appendChild(eventWrapper)
    })
  }
  eventsBoardWrapper.appendChild(eventsWrapper)
  return eventsBoardWrapper
}
RenderHelper.prototype.dailyClassName = function(d) {
  var md = moment(d).locale(this.locale)
  var isNextMonth = (moment().format('MM') !== md.format('MM')) ? 1 : 0
  var isLastDay
    = (md.format('d') == moment().endOf('month').format('d')) ? 1 : 0
  var isToday = (moment().format('MMDD') == md.format('MMDD')) ? 1 : 0
  var text
    = " daily weekday_" + md.format('E')
    + ((isNextMonth) ? " nextmonth" : "")
    + " monDate_" + md.format('MMDD')
    + " month_" + md.format('M')
    + " date_" + md.format('D')
    + ((isToday) ? " today" : "")
    + ((isLastDay) ? " lastday" : "")
  return text
}
RenderHelper.prototype.weeklyClassName = function(d) {
  var lc = this.locale
  var md = moment(d).locale(lc)
  var now = moment().locale(lc)
  var isNextYear = (moment(now).format('gggg') !== md.format('gggg')) ? 1 : 0
  var isLastWeek = (md.format('w') == 53) ? 1 : 0
  var isThisWeek = (moment().format('ww') == md.format('ww')) ? 1 : 0
  var text
    = " weekly weeks_" + md.format('w')
    + ((isNextYear) ? " nextyear" : "")
    + ((isThisWeek) ? " thisweek" : "")
    + ((isLastWeek) ? " lastweek" : "")
  return text
}
RenderHelper.prototype.monthlyClassName = function(d) {
  var md = moment(d).locale(this.locale)
  var isNextYear = (moment().format('YYYY') !== md.format('YYYY')) ? 1 : 0
  var isLastMonth = (md.format('M') == 12) ? 1 : 0
  var isThisMonth = (moment().format('M') == md.format('M')) ? 1 : 0
  var text
    = " monthly months_" + md.format('M')
    + ((isNextYear) ? " nextyear" : "")
    + ((isThisMonth) ? " thismonth" : "")
    + ((isLastMonth) ? " lastmonth" : "")
  return text
}
RenderHelper.prototype.eventPeriodString = function(mode, cfg, event) {
  var lc = this.locale
  var sd = moment(parseInt(event.startDate)).locale(lc)
  var ed = moment(parseInt(event.endDate)).locale(lc)
  var text = ""

  if (mode == 'upcoming') {
    if(cfg.useRelative) {
      text = sd.fromNow()
      return text
    }
  }

  if (mode == 'current') {
    if(cfg.useRelative) {
      text = ed.fromNow()
      return text
    }
  }

  var isSameTime = (ed.format('YYMMDDHHmm') == sd.format('YYMMDDHHmm')) ? 1 : 0
  var isSameDay = (ed.format('YYMMDD') == sd.format('YYMMDD')) ? 1 : 0

  if(event.fullDayEvent) {
    var format = cfg.fullDayEventDateFormat
    text = sd.format(format)
    text += (isSameDay) ? "" : (" - " + ed.format(format))
  } else {
    var timeFormat = cfg.timeFormat
    var dateFormat = cfg.dateFormat
    var end = ""
    var start = ""

    start = sd.format(dateFormat)
    start
      = ((mode !== 'daily' || !isSameDay) ? (start + " ") : "")
      + sd.format(timeFormat)
    end
      = " - "
      + ((isSameDay) ? "" : ed.format(dateFormat)) + " "
      + ed.format(timeFormat)
    end = (isSameTime) ? "" : end
    text = start + end
  }
  return text
}
RenderHelper.prototype.getRegionContainer = function(regionName) {
  var className = regionName.replace("_", " ")
  className = "region " + className
  var nodes = document.getElementsByClassName(className)
  if (nodes.length !== 1) return 0
  var container = nodes[0].querySelector('.container')
  return container
}

function Render(showing=1, classes="") {
  this.showing = showing
  this.classes = classes
}
Render.prototype.hide = function() {
  this.showing = 0
  var doms = document.getElementsByClassName('CALEXT module_fake')
  if(doms.length > 0) {
    for(var i=0; i<doms.length; i++) {
      doms[i].style.display = 'none'
    }
  }
}
Render.prototype.show = function() {
  this.showing = 1
  var doms = document.getElementsByClassName('CALEXT module_fake')
  if (doms.length > 0) {
    for(var i=0; i<doms.length; i++) {
      doms[i].style.display = 'none'
    }
  }
}
Render.prototype.eraseAllViews = function() {
  var doms = document.getElementsByClassName('CALEXT module_fake')
  if (doms.length > 0) {
    for(var i=0; i<doms.length; i++) {
      doms[i].outerHTML = ""
      delete doms[i]
    }
  }
}
Render.prototype.drawViews = function(views, cfg, slot, classes=null) {
  if (!this.showing) return

  this.locale = cfg.system.locale
  var RH = new RenderHelper(this.locale)

  var viewDom = {}
  var oldDom = null
  var self = this
  views.forEach(function(mode) {
    viewDom[mode]
      = (mode == 'month')
        ? RH.getMonthDom(cfg.views[mode], slot[mode] , classes)
        : RH.getSlotDom(mode, cfg.views[mode], slot[mode], classes)
    oldDom = document.getElementById('CALEXT_CONTAINER_' + mode)
    if(oldDom) {
      oldDom.outerHTML = ""
      delete oldDom
    }
  })

  cfg.system.show.forEach(function (mode){
    var position = cfg.views[mode].position
    var hookDom = RH.getRegionContainer(position)
    var showEmptyView = cfg.system.showEmptyView
    var isEmptyView
      = (viewDom[mode].getElementsByClassName('event').length) ? 0 : 1

    if (!(!showEmptyView && isEmptyView)) {

      var order = cfg.views[mode].positionOrder;
      var children = hookDom.children;
      if (order == -1) {
        hookDom.appendChild(viewDom[mode])
      } else if(order >= 0 && order < children.length) {
        hookDom.insertBefore(viewDom[mode], children[order])
      } else {
        hoodDom.appendChild(viewDom[mode])
      }




      hookDom.style.display = 'block'
      Render.rollOverflow(mode, cfg.views[mode])
    }
  })
}
Render.prototype.setClasses = function(classes) {
  this.classes = classes
}
Render.prototype.rollOverflow = function(mode, cfg) {
  if (cfg.overflowRolling !== 1) {
    return 0
  }

  var self = this
  var height = cfg.overflowHeight
  var dom = document.getElementById('CALEXT_CONTAINER_' + mode)
  if (typeof dom === 'undefined' || dom == null) return 0
  var eventBoards = dom.getElementsByClassName('eventsBoard')
  if (typeof eventBoards === 'undefined' || eventBoards == null) return 0
  var nodes = [].slice.call(eventBoards)
  nodes.forEach(function(node){
    if (height < node.clientHeight) {
      node.className = "eventsBoard overflowed"
      node.style.height = height + "px"
      if (cfg.overflowRolling !== 1) {
        return 0
      }
      var copieshack = [].slice.call(node.childNodes)
      var duration = copieshack[0].childNodes.length * cfg.overflowDuration
      copieshack.forEach(function(n){
        n.style.animationDuration = duration + 's'
        node.appendChild(n.cloneNode(1))
      })
    } else {
        node.className = "eventsBoard"
    }
  })
}

var Render = new Render
var Slots = new Slots


Module.register("MMM-CalendarExt", {
  events: [],
  instantEvents: [],
  CurrentConfigs: {}, //this.cfg = new Configs()
  //slot: {},

  getScripts: function () {
    return ["moment.js"]
  },

  getStyles: function () {
    return ["font-awesome.css", "custom.css"]
  },

  start: function() {
    this.showing = 1
    this.isInit = 0
    this.redrawTimer = null
  },

  suspend: function() {
    this.showing = 0
    Render.hide()
    this.draw()
  },

  resume: function() {
    this.showing = 1
    Render.show()
    this.draw()
  },

  addCalendars: function() {
    for (var c in this.CurrentConfigs.cfg.calendars) {
      this.addCalendar(this.CurrentConfigs.cfg.calendars[c])
    }
  },

  resetCalendars: function() {
    this.events=[];
    Slots.resetSlots();
    this.sendSocketNotification("RESET_CALENDARS", this.CurrentConfigs.cfg)
  },

  addCalendar: function (calendar, sender = SELFNAME, reqKey = null) {
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
      Render.drawViews(
        this.CurrentConfigs.cfg.system.show,
        this.CurrentConfigs.cfg,
        Slots.getAllSlots(),
        this.data.classes
      )
    }
    var wrapper = null
    wrapper = document.createElement("div")
    wrapper.id = 'CALEXT_proxy'
    wrapper.className = 'proxy'
    return wrapper
  },

  fetchEvents: function(pl=null) {
    var curCfg = this.CurrentConfigs.cfg
    var locale = curCfg.system.locale
    var oldLimit = moment().startOf('month').startOf('week').startOf('day')

    var self = this
    curCfg.system.show.forEach(function(mode) {
      Slots.prepare(mode, curCfg.views[mode], locale)
    })

    this.instantEvents = this.instantEvents.filter(function (e) {
      var uid = e.uid.split('@')[0]
      var msg = {
        message : "",
        uid : uid,
        sessionId : null,
        sender: e.sender,
      }
      var valid = moment(e.endDate).isAfter(oldLimit)
      if(!valid) {
        msg.message = e.uid
        self.sendNotification('CALEXT_SAYS_USELESS_EVENT_REMOVED', msg)
      }
      return valid
    })

    pl = (pl) ? pl : this.events
    payload = pl.concat(this.instantEvents)
    payload.forEach(function (e){
      if (self.profile !== null) { // not all shown, profile selected
        if(e.profiles.length > 0) { //this event is not for everyone
          if (e.profiles.indexOf(self.profile) < 0) { //current profile is in this event
              return
          }
        }
      }
      var eStart = moment(parseInt(e.startDate))
      var eEnd = moment(parseInt(e.endDate))
      if (oldLimit.isAfter(eEnd)) {
          //too old events.
      } else {
        eStart = moment(parseInt(e.startDate))
        eEnd = moment(parseInt(e.endDate))

        if (curCfg.system.fullDayEventLocalize == 1) {
          if (e.fullDayEvent == 1) {
            var timegap = e.endDate - e.startDate - 1
            e.startDate = eStart.startOf('day').valueOf()
            e.endDate = e.startDate + timegap
          }
        }
        for(var p in curCfg.system.show) {
            var mode = curCfg.system.show[p]
            if((e.views.length !== 0) && (e.views.indexOf(mode) < 0)) {
              continue
            }
            var slots = Slots.getSlot(mode)

            if (
              (mode == 'upcoming' || mode == 'current')
              && slots.slot.length >= curCfg.views[mode].limit
            ) {
              continue
            }
            for (var i = 0; i < slots.slotIndex.length - 1; i++) {
              var start = moment(parseInt(slots.slotIndex[i]))
              var end = moment(parseInt(slots.slotIndex[i + 1]))
              if (mode == 'current') {
                if (
                  eEnd.isSameOrAfter(start)
                  && eStart.isSameOrBefore(end)
                  && curCfg.views[mode].limit > slots.slot[i].length
                ) {
                  slots.slot[i].push(e)
                }
              } else { //another mode
                if (eEnd.isSameOrBefore(start) || eStart.isSameOrAfter(end)) {
                  //do nothing; out of date range
                } else {
                  if(mode == 'upcoming') {
                    if(
                      curCfg.views[mode].limit > slots.slot[i].length
                      && eStart.isAfter(start)
                    ) {
                      slots.slot[i].push(e)
                    } else {
                      //slot full
                    }
                  } else {
                    slots.slot[i].push(e)
                  }
                }
              }
            }
            Slots.setSlot(mode, slots)
        }
      }
    })
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
      console.log('FAIL', eventUid)
      this.sendNotification('CALEXT_SAYS_REMOVE_EVENT_RESULT', msg)
    } else {
      this.draw()
    }
  },

  addInstantEvent: function(event, senderName, sessionId) {
    var redraw = 0
    var msg = {
      message : "",
      sessionId : sessionId,
      sender : senderName
    }

    if(this.instantEvents.filter(function (e) {
      return e.sender == senderName
    }).length >= 100) {
      console.log('too many')
      msg.message = 'TOO_MANY_EVENTS'
      this.sendNotification('CALEXT_SAYS_ADD_EVENT_RESULT', msg)
    }

    var curCfg = this.CurrentConfigs.cfg

    var eDefault = {
      sender:null,
      uid: null,
      profiles: [],
      views: [],
      color: curCfg.calendarDefault.color,
      inverseColor: curCfg.calendarDefault.inverseColor,
      symbol: curCfg.calendarDefault.symbol,
      title: null,
      description: null,
      location: null,
      geo: null,
      startDate: moment().valueOf(),
      endDate: moment().valueOf(),
      fullDayEvent: 0,
    }

    for(var param in eDefault) {
      if (typeof event[param] === 'undefined') {
        event[param] = eDefault[param]
      }
    }
    event.uid = ((event.uid) ? event.uid : sessionId) + '@' + senderName
    event.sender = senderName

    var eArr = this.instantEvents.filter(function (e) {
      return (e.sender == senderName) && (e.uid == event.uid)
    })
    var eOrigin = (eArr.length == 1) ? eArr[0] : null

    if (!eOrigin) {
      this.instantEvents.push(event)
      msg.message = 'EVENT_ADDED'
      this.sendNotification('CALEXT_SAYS_ADD_EVENT_RESULT', msg)
      redraw = 1
    } else {
      var chkChng = 0
      for(var param in eOrigin) {
        if (typeof event[param] !== 'undefined') {
          if (event[param] !== eOrigin[param]) {
            eOrigin[param] = event[param]
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

  saySchedule(filterOrigin, senderName, sessionId) {
    var filter ={}
    var filterDefault = {
      profiles: [],
      names: [],
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

      return 1
    }).sort(function(a,b){
      return a.startDate - b.startDate
    }).slice(0, filter.count)

    var cleanedEvents = []
    for (var i=0; i<final.length; i++) {
      cleanedEvents.push({
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
      filter: filterOrigin
    }

    if (final.length > 0) {
      msg.message = "SCHEDULE_FOUND"
      msg.events = cleanedEvents
    } else {
      msg.message = "SCHEDULE_NOTFOUND"
    }

    this.sendNotification('CALEXT_SAYS_ADD_EVENT_RESULT', msg)
  },

  notificationReceived: function(notification, payload, sender) {
    var sessionId = moment().valueOf()
    if (typeof payload !== 'undefined') {
      if (typeof payload.sessionId !== 'undefined') {
        sessionId = payload.sessionId
      }
    }

    switch (notification) {
      case 'DOM_OBJECTS_CREATED':
        this.loadCSS()
        this.initAfterLoading()
        break
      case 'CURRENT_PROFILE':
        this.initAfterLoading(payload)
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
    }
  },

  socketNotificationReceived: function(notification, payload) {
    switch (notification) {
      case 'CALENDAR_MODIFIED':
        this.events = payload
        this.draw()
        break
      case 'READY_TO_ADD_CALENDAR':
        this.addCalendars()
        this.draw()
        break;
          }
  },

  initAfterLoading(profile=null) {
    var self = this
    this.CurrentConfigs = new Configs().make(this.config)
    //if(profile == 'User2') debugger;
    if(!profile) {
      this.profile = this.CurrentConfigs.cfg.system.startProfile
    } else {
      this.profile = profile
    }
    if (this.CurrentConfigs.cfg.system.useProfileConfig) {
      if (typeof this.config.profileConfig !== 'undefined') {
        if (typeof this.config.profileConfig[this.profile] !== 'undefined') {
          this.CurrentConfigs
            = new Configs().make(this.config.profileConfig[this.profile])
        }
      }
    }


    Render.eraseAllViews()
    this.events = []
    Slots.resetSlots()
    this.resetCalendars()



    this.isInit = 1

  },
  loadCSS: function() {
    var css = [
      {
        id:'googleMaterialDesignIcon',
        href: 'https://fonts.googleapis.com/icon?family=Material+Icons',
      },
      {
        id:'emojiCss',
        href: 'https://afeld.github.io/emoji-css/emoji.css'
      },
      {
        id:'flagCSS',
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
    if(!this.isInit) {
      return
    }
    this.fetchEvents()
    this.updateDom()
    var self = this

    clearInterval(this.redrawTimer)
    this.redrawTimer = null
    var redrawInterval = null
    if (typeof this.CurrentConfigs.cfg !== 'undefined') {
      redrawInterval = this.CurrentConfigs.cfg.system.redrawInterval
    }
    if (redrawInterval < 60000) {
      redrawInterval = 1*60*1000
    }

    this.redrawTimer = setInterval(function() {
      self.draw()
    }, redrawInterval)
  },
})
