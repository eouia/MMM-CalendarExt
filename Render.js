function RenderHelper(locale) {
  this.locale = (locale) ? locale : moment.locale()
  return this
}
RenderHelper.prototype.setLocale = function(locale) {
  this.locale = locale
}

RenderHelper.prototype.getSlotDom = function(mode, cfgView) {
  var cfg = cfgView
  var counts = cfg.counts;
  var locale = cfg.locale;

  var wrapper = document.createElement("div")
  wrapper.id = 'CALEXT_' + mode
  wrapper.className = "wrapper slots slots_" + mode + " " + mode
  wrapper.style.flexDirection = cfg.direction

  var table, showWeeks
  if (mode == 'month') { //month table prepare
    showWeeks = cfg.showWeeks
    var monthTitleWrapper = document.createElement("div")
    monthTitleWrapper.className = "monthTitle month_" + moment().format('M')
    monthTitleWrapper.innerHTML
      = moment().startOf('month').format(cfg.monthTitleFormat)

    wrapper.appendChild(monthTitleWrapper)

    var calStart = moment().locale(locale).startOf('month').weekday(0).startOf('day')

    table = document.createElement("table")
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
    var s = moment().locale(locale).startOf('week')
    for(var i=0; i<7; i++) {
      var th = document.createElement('th')

      th.className = 'day_' + moment(s).format('E')
      th.innerHTML = moment(s).format('dd')
      s.add(1, 'day')
      tr.appendChild(th)
    }
    thead.appendChild(tr)
    table.appendChild(thead)
  }




  var tmpl = {
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

  var cur = moment().locale(locale)

  var slotStart, slotEnd, d, p

  if (mode == 'month') {
    var lastMonSlots = moment(cur).startOf('month').weekday()
    var thisMonSlots = moment(cur).daysInMonth()
    counts = Math.ceil((lastMonSlots + thisMonSlots) / 7) * 7
    cur = moment(cur).startOf('month').weekday(0).startOf('day')
  }

  var tr
  for(var i = 0; i < counts; i++) {
    if (mode == 'upcoming') {
      slotStart = moment(cur).valueOf()
      slotEnd = moment(cur).add(100, 'years').valueOf() //TODO I want to remove this constant number, but..
      p = 'days'
    } else if (mode == 'current') {
      slotStart = moment(cur).valueOf()
      slotEnd = moment(cur).valueOf()
      p = 'days'
    } else {

      //daily, monthly, weekly,
      d = tmpl[mode].d
      p = tmpl[mode].p
      slotStart = moment(cur).startOf(d).valueOf()
      slotEnd = moment(cur).endOf(d).valueOf()
    }


    if (mode == 'month') {
      if (i % 7 == 0) {
        tr = document.createElement("tr")

        var th = document.createElement("th")
        th.innerHTML = moment(slotStart).format(cfg.weeksFormat)
        tr.appendChild(th)
      }
    }

    var slotWrapper
      = (mode == 'month')
        ? document.createElement("td")
        : document.createElement("div")


    slotWrapper.className = "slot slot_" + mode
    slotWrapper.id = "slotId_" + slotStart
    slotWrapper.dataset.view = mode
    slotWrapper.dataset.start = slotStart
    slotWrapper.dataset.end = slotEnd
    slotWrapper.dataset.startH = moment(slotStart).format('YYYY-MM-DD HH:mm:ss')
    slotWrapper.dataset.endH = moment(slotEnd).format('YYYY-MM-DD HH:mm:ss')

    var title = ""
    var subtitle = ""

    if(mode !== 'upcoming' && mode !== 'current') {
      var className = ""
      var now = moment().locale(locale)
      var sStart = moment(slotStart).locale(locale)
      var sEnd = moment(slotEnd).locale(locale)

      var isToday = (now.isBetween(sStart, sEnd)) ? 1 : 0

      var isThisWeek = (sStart.format('w') == now.format('w')) ? 1 : 0
      var isThisMonth = (sStart.format('M') == now.format('M')) ? 1 : 0
      var isThisYear = (sStart.format('gggg')) == now.format('gggg') ? 1 : 0
      var tDay = sStart.format('E')
      var tLocaleDay = sStart.format('e')
      var tWeek = sStart.format('w')
      var tDate = sStart.format('D')
      var tMonth = sStart.format('M')
      var tYear = sStart.format('gggg')
      var tLocaleYear = sStart.format('YYYY')

      switch(mode) {
        case 'month':
        case 'daily':
          className += " day_" + tDay + " localeDay_" + tLocaleDay + " date_" + tDate
        case 'weekly':
          className += " week_" + tWeek
        case 'monthly':
          className += " month_" + tMonth + " year_" + tYear + " localeYear_" + tLocaleYear
        default:
          className
            += ((isToday) ? " today" : "")
            + ((isThisWeek) ? " thisweek" : "")
            + ((isThisMonth) ? " thismonth" : "")
            + ((isThisYear) ? " thisyear" : "")
          break;
      }

      slotWrapper.className += className

      var md = moment(sStart).locale(locale)

      switch(mode) {
        case "monthly":
          title
            = (isThisYear)
              ? md.format(cfg.titleFormat) : md.format(cfg.overTitleFormat)
          subtitle = md.format(cfg.subtitleFormat)
          break
        case "weekly":
          title
            = (isThisYear)
              ? md.format(cfg.titleFormat)
              : md.format(cfg.overTitleFormat)
          subtitle
            = moment(md).startOf('week').format(cfg.subtitleFormat)
            + " - "
            + moment(md).endOf('week').format(cfg.subtitleFormat)
          break
        case "daily":
            subtitle = md.format(cfg.subtitleFormat)
        case "month":
          title
            = (isThisMonth)
              ? md.format(cfg.titleFormat)
              : md.format(cfg.overTitleFormat)
          break
      }

    } else {
      title = cfg.title
    }

    var headerWrapper = document.createElement("div")
    headerWrapper.className = "header"
    var headerTitleWrapper = document.createElement("div")
    headerTitleWrapper.className = "title"
    var headerSubtitleWrapper = document.createElement("div")
    headerSubtitleWrapper.className = "subtitle"

    headerTitleWrapper.innerHTML = title
    headerSubtitleWrapper.innerHTML = subtitle

    headerWrapper.appendChild(headerTitleWrapper)
    headerWrapper.appendChild(headerSubtitleWrapper)

    slotWrapper.appendChild(headerWrapper)

    var eventsBoardWrapper = document.createElement("div")
    eventsBoardWrapper.className = "eventsBoard"
    var eventsWrapper = document.createElement("ul")
    eventsWrapper.className = "events view_" + mode
    eventsWrapper.dataset.mode = mode



    eventsBoardWrapper.appendChild(eventsWrapper)
    slotWrapper.appendChild(eventsBoardWrapper)

    if (mode == 'month') {
      tr.className
        = "week_" + moment(slotStart).format('w')
        + ((isThisWeek) ? " thisweek" : "")

      tr.appendChild(slotWrapper)
      if (i % 7 == 6) {
        table.appendChild(tr)
      }
    } else {
      wrapper.appendChild(slotWrapper)
    }
    // end slotWrapper
    cur.add(1, p)
  }

  if (mode == 'month') {
    wrapper.appendChild(table)
  }

  var container = document.createElement("div")
  container.className
    = "CALEXT module module_fake "
   //+ classes
  container.id = 'CALEXT_CONTAINER_' + mode
  container.appendChild(wrapper)
  return container
}



RenderHelper.prototype.getEventDom = function(ev, cfg, matched) {

  var mode = cfg.mode

  var eventWrapper = document.createElement("li")

  var sa = ev.symbol.split('@')
  var symbol = sa[0]
  var symbolType = (typeof sa[1] !== 'undefined') ? sa[1] : 'fa'

  eventWrapper.className
    = "event"
    + ((matched & 1) ? " startHere" : "")
    + ((matched & 2) ? " endHere" : "")

  for(p in ev) {
    if (ev[p]) {
      if(Array.isArray(ev[p])) {
        if(ev[p].length > 0) {
          eventWrapper.dataset[p] = ev[p].toString()
        }
      } else {
        eventWrapper.dataset[p] = ev[p]
      }
    }
  }

  var symbolWrapper = document.createElement("div")
  if (symbolType == 'md') {
    symbolWrapper.className
      = "google-material-design symbol symbol_" + symbol
    symbolWrapper.innerHTML
      = (mode == 'month')
        ? "<i class='material-icons md-12'>" +symbol + "</i>"
        : "<i class='material-icons'>" +symbol + "</i>"
  } else if (symbolType == 'fi') {
    symbolWrapper.className
      = "flag-icon-css symbol symbol_" + symbol
    symbolWrapper.innerHTML
      = "<span class='flag-icon flag-icon-squared flag-icon-"
      + symbol
      + "'></span>"
  } else if (symbolType == 'em') {
    symbolWrapper.className
      = "emoji symbol symbol_" + symbol
    symbolWrapper.innerHTML
      = "<i class='em em-" +symbol + "'></i>"
  } else {
    symbolWrapper.className
      = "font-awesome symbol symbol_" + symbol
    symbolWrapper.innerHTML
      = "<i class='fa  fa-"
      + symbol
      + "'></i>"
  }


  var eventContainerWrapper = document.createElement("div")
  eventContainerWrapper.className = "eventContainer"
  var eventTimeWrapper = document.createElement("div")
  eventTimeWrapper.className = "eventTime"
  var eventContentWrapper = document.createElement("div")
  eventContentWrapper.className = "eventContent"

  //eventContentWrapper.style.color = color
  eventContentWrapper.innerHTML = this.replaceTitle(ev.title, cfg.replacePattern)
  var eventLocationWrapper = document.createElement("div")
  eventLocationWrapper.className = "eventLocation"
  eventLocationWrapper.innerHTML = ev.location ? ev.location : ""
  var eventDescriptionWrapper = document.createElement("div")
  eventDescriptionWrapper.className = "eventDescription"
  eventDescriptionWrapper.innerHTML = ev.description ? ev.description : ""

  if(cfg.oneLineEvent) {
    eventContentWrapper.className += " oneLineEvent"
    eventTimeWrapper.className += " oneLineEvent"
    eventDescriptionWrapper.className += " oneLineEvent"
    eventLocationWrapper.className += " oneLineEvent"
  }

  if (ev.fullDayEvent) {
    eventWrapper.className += " fulldayevent"
  }


  eventTimeWrapper.innerHTML = this.eventPeriodString(cfg, ev)


  eventContainerWrapper.appendChild(eventTimeWrapper)
  eventContainerWrapper.appendChild(eventContentWrapper)
  eventContainerWrapper.appendChild(eventDescriptionWrapper)
  eventContainerWrapper.appendChild(eventLocationWrapper)

  if(Array.isArray(cfg.styleNamePattern) && cfg.styleNamePattern.length > 0) {
    for (var i=0; i<cfg.styleNamePattern.length; i++) {
      eventWrapper.className += cfg.styleNamePattern[i]
    }
  }

  eventWrapper.className += " " + ev.styleName

  eventWrapper.appendChild(symbolWrapper)
  eventWrapper.appendChild(eventContainerWrapper)

  return eventWrapper
}

RenderHelper.prototype.eventPeriodString = function(cfg, ev) {
  var mode = cfg.mode
  var lc = this.locale
  var sd = moment(parseInt(ev.startDate)).locale(lc)
  var ed = moment(parseInt(ev.endDate)).locale(lc)
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

  if(ev.fullDayEvent) {
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

function Render(showing=1) {
  this.showing = showing
  return this
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
  var flag = 1
  var doms = document.getElementsByClassName('CALEXT module_fake')

  while(doms.length > 0){
    doms[0].parentNode.removeChild(doms[0]);
  }


  var doms = document.getElementsByClassName('CALEXT module_fake')
}

Render.prototype.drawViews = function(curConfig, events) {
  if (!this.showing) return 0
  this.eraseAllViews()
  var self = this
  var locale = curConfig.system.locale
  var views = curConfig.views
  var RH = new RenderHelper(locale)

  var showViews = curConfig.system.show

  //var slots = this.fetchEvents(curConfig, showViews, events, locale)

  var viewDom = {}
  //var oldDom = null
  var self = this
  showViews.forEach(function(mode) {
    var viewConfig = curConfig.getViewConfig(mode)
    viewDom = RH.getSlotDom(mode, viewConfig, events)
    var position = viewConfig.position
    var hookDom = RH.getRegionContainer(position)
    var showEmptyView = curConfig.system.showEmptyView
    var isEmptyView
      = (viewDom.getElementsByClassName('event').length) ? 0 : 1

    if (!(!showEmptyView && isEmptyView)) {
      var order = viewConfig.positionOrder;
      var children = hookDom.children;
      if (order == -1) {
        hookDom.appendChild(viewDom)
      } else if(order >= 0 && order < children.length) {
        hookDom.insertBefore(viewDom, children[order])
      } else {
        hookDom.appendChild(viewDom)
      }
      hookDom.style.display = 'block'

    }
  })

  var slots = document.querySelectorAll(".CALEXT .slot")
  if (slots.length > 0) {
    events.forEach(function(e) {
      var eStart = moment(parseInt(e.startDate)).locale(locale)
      var eEnd = moment(parseInt(e.endDate)).locale(locale)

      if (eEnd.format("HHmmss") == '000000') {
        eEnd.add(-1, 's')
      }
      if (curConfig.system.fullDayEventLocalize == 1) {
        if (e.fullDayEvent == 1) {
          eStart.startOf('day')
          eEnd.endOf('day')
        }
      }



      var tCfg = {};
      slots.forEach(function(slot) {
        var ct = slot.querySelector('.eventsBoard .events')
        var tmode = slot.dataset.view
        var childs = ct.children;
        if (typeof tCfg[tmode] == 'undefined') {
          tCfg[tmode] = curConfig.getViewConfig(tmode)
        }
        if (ct.children.length >= tCfg[tmode].limit) return 0

        var sStart = moment(parseInt(slot.dataset.start)).locale(locale)
        var sEnd = moment(parseInt(slot.dataset.end)).locale(locale)

        var slotMode = slot.dataset.view

        var matched
        if (slotMode == 'current') {
          matched = (moment().locale(locale).isBetween(eStart, eEnd)) ? 3 : 0
        } else {

          var isEventStartHere = eStart.isBetween(sStart, sEnd, null, "[)") ? 1 : 0
          var isEventEndHere = eEnd.isBetween(sStart, sEnd, null, "(]") ? 2 : 0
          var isEventBetween = (eStart.isSameOrBefore(sStart) && eEnd.isSameOrAfter(sEnd)) ? 4 : 0
          matched = isEventStartHere + isEventEndHere + isEventBetween

        }
        if (matched > 0) {
          ct.appendChild(RH.getEventDom(e, tCfg[tmode], matched))
        }
      })
    })
  }
  var self = this
  showViews.forEach(function(mode) {
    var viewConfig = curConfig.getViewConfig(mode)
    self.rollOverflow(mode, viewConfig)
  })
}






/*
Render.prototype.setClasses = function(classes) {
  this.classes = classes
}
*/
Render.prototype.rollOverflow = function(mode, cfg) {
  var self = this
  var height = cfg.overflowHeight
  var dom = document.getElementById('CALEXT_CONTAINER_' + mode)
  if (typeof dom === 'undefined' || dom == null) return 0
  var eventBoards = dom.getElementsByClassName('eventsBoard')
  if (typeof eventBoards === 'undefined' || eventBoards == null) return 0
  var nodes = [].slice.call(eventBoards)
  nodes.forEach(function(node){
    if (height < node.clientHeight  && height !== 0) {
      node.className = "eventsBoard overflowed"
      node.style.height = height + "px"
      node.style.overflow = 'hiddne'
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
        node.style.overflow = 'auto'
    }
  })
}
//var Render = new Render
RenderHelper.prototype.replaceTitle = function(title, rArr) {
  if(!Array.isArray(rArr)) return title
  for(var i = 0; i < ArrOfReplace.length; i++) {
    var repl = rArr[i]
    if(!Array.isArray(repl) || repl.length < 2) continue;
    title = title.replace(repl[0].toRegexp(), repl[1])
  }
}

RenderHelper.prototype.patternClassName = function(title, pattern) {
  if(!Array.isArray(pattern || pattern.length < 2)) return ""
  if(title.match(pattern[0].toRegexp())) return " " + pattern[1]
  return ""
}

String.prototype.toRegexp = function() {
  var lastSlash = this.lastIndexOf("/")
  var restoredRegex = new RegExp(
    this.slice(1, lastSlash),
    this.slice(lastSlash + 1)
  )
  return restoredRegex
}
