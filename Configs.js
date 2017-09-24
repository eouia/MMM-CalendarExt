var DEFAULT_CONFIG = {
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
      overTitleFormat: "gggg wo",
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
      useRelative: 1
    },
    current: {
      title: 'Current',
      useRelative: 1
    },
    month: {
      titleFormat : 'D',
      overTitleFormat : 'MMM D',
      monthTitleFormat: "MMMM",
      weekdayFormat: 'ddd',
      showWeeks: 1,
      weeksTitle: 'weeks',
      weeksFormat: 'wo',
    }
  },
  calendars: [],
  defaultView: {
    position: 'bottom_bar',
    positionOrder: -1,
    overflowRolling: 0,
    overflowHeight: 0,
    overflowDuration: 2,
    timeFormat: 'HH:mm',
    dateFormat: "MMM Do",
    fullDayEventDateFormat: "MMM Do",
    ellipsis: 0,
    limit:0,
    oneLineEvent:0,
    replaceTitle: [],
    classPattern: [],
    classPatternWhere: ["title"]
  },
  defaultCalendar: {
    name: null,
    profiles: [],
    views: [],
    styleName: "",
    replaceTitle: [],
    classPattern: [],
    classPatternWhere: ["title"],
    ellipsis: 0,
    symbol: "",
    maxEntries:50,
    maxDays:180,
    interval: 30*60*1000,
    url: null,
    auth: {
      user:"",
      pass:"",
      method:""
    }
  }
}






function Configs(
  systemConfig={},
  viewsConfig={},
  calendarsConfig={},
  profileConfigs={},
  defaultViewConfig={},
  defaultCalendarConfig={}
) {
  this.system = systemConfig
  this.views = viewsConfig
  this.calendars = calendarsConfig
  this.profileConfigs = profileConfigs
  this.defaultView = defaultViewConfig
  this.defaultCalendar = defaultCalendarConfig

  return this;
}

Configs.prototype.mix = function(tmpl, ncfg, includeCalendars=1) {
  var cfg = {}

  //system

  var tcfg = (typeof ncfg.system !== 'undefined') ? ncfg.system : {}
  cfg.system = this.assignment({}, tmpl.system, tcfg)
  if(!cfg.system.locale) {
    cfg.system.locale = moment.locale()
  }

  //views
  if(ncfg.views !== 'undefined') {
    cfg.views = this.assignment({}, tmpl.views, ncfg.views)
  }

  //defaultView
  if(ncfg.defaultView !== 'undefined') {
    cfg.defaultView = this.assignment({}, tmpl.defaultView, ncfg.defaultView)
  }
  //defaultCalendar
  if(ncfg.defaultCalendar !== 'undefined') {
    cfg.defaultCalendar = this.assignment(
      {},
      tmpl.defaultCalendar,
      ncfg.defaultCalendar
    )
  }

  //profileConfig
  if (ncfg.profileConfigs !== 'undefined') {
    cfg.profileConfigs = this.assignment({}, ncfg.profileConfigs)
  }
  //calendars
  if (!includeCalendars || typeof ncfg.calendars == 'undefined') {
    cfg.calendars = this.assignment({}, tmpl.calendars)
  } else {
    cfg.calendars = this.assignment({}, ncfg.calendars)
  }
  return cfg
}

Configs.prototype.getCalConfig = function(idx) {
  return this.assignment(
    {},
    DEFAULT_CONFIG.defaultCalendar,
    this.defaultCalendar,
    this.calendars[idx]
  )
}

Configs.prototype.getViewConfig = function (idx) {
  var ret = this.assignment(
    {},
    DEFAULT_CONFIG.defaultView,
    this.defaultView,
    this.views[idx]
  )
  if (idx == 'upcoming' || idx == 'current' || idx == 'month') {
    ret.counts = 1
  }
  if (typeof ret.locale == 'undefined') {
    ret.locale = this.system.locale
  } else {
    if (ret.locale == '') {
      ret.locale = this.system.locale
    }
  }
  ret.mode = idx
  return ret
}

Configs.prototype.make = function(newCfg) {
  var ret = this.mix(DEFAULT_CONFIG, newCfg)
  return new Configs(
    ret.system,
    ret.views,
    ret.calendars,
    ret.profileConfigs,
    ret.defaultView,
    ret.defaultCalendar
  )
}
Configs.prototype.modify = function(newCfg) {
  var ret = this.mix(this, newCfg)
  this.system = ret.system
  this.views = ret.views
  this.calendars = ret.calendars
  this.defaultView = ret.defaultView
  this.defaultCalendar = ret.defaultCalendar
  this.profileConfigs = ret.profileConfigs
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
            result[key] = this.assignment({}, result[key], item[key]);
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
