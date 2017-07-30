//ToDo
//iCal implements for Standalone // Almost done
//month view
//Command by notification and http endpoint (dynamic add and remove calendar and event);
//auto hide when there is no events
//

const SELFNAME = 'calext';
const VIEWS = ['daily', 'weekly', 'monthly', 'upcoming', 'month'];


/*
function m2d(i) {
    return moment(parseInt(i)).format('YY/MM/DD HH:mm:ss');
};
*/

Module.register("MMM-CalendarExt", {
    defaultConfig: {
        debug: 1,
        show : ['daily'],
        fullDayEventLocalize: 1,
        redrawInterval: 30*60*1000, //minimum 60000
        //locale: inhrerited from System;
        globalView: {
            direction: 'row',
            position: 'bottom_bar',
            overflowRolling: 1,
            overflowHeight: 100,
            overflowDuration: 2,
            timeFormat: 'HH:mm',
            dateFormat: "MMM Do",
            fullDayEventDateFormat: "MMM Do",
            ellipsis: 0,
            showTime: 1,
            showLocation: 1
        },

        daily: {
            counts: 7,
            titleFormat: "D",
            overTitleFormat: "MMM D",
            subtitleFormat: "ddd",
        },

        weekly: {
            counts: 4,
            titleFormat: "wo",
            overTitleFormat: "gggg w Week",
            subtitleFormat: "MMM Do",

        },

        monthly: {
            counts: 4,
            titleFormat: "MMMM",
            overTitleFormat: "YYYY MMM",
            subtitleFormat: "YYYY",

        },

        upcoming: {
            title: 'Upcoming',
            counts: 20,
            useRelative: 1
        },

        month: {
            titleFormat : 'D',
            overTitleFormat : 'MMM D',
            /*subtitleFormat: '', */ //not use
            monthTitleFormat: "MMMM",
            weekdayFormat: 'dd',
            showWeeks: 1,
            weeksTitle: 'weeks',
            weeksFormat: 'wo',
        },

        calendarDefault: {
            name: null,
            classes: [],
            views: [],
            color: "#CCC",
            inverseColor: "#FFF",
            symbol: "calendar",
            replace: [],
            maxEntries:100,
            maxDays:365,
            interval: 1800000,
            url: null,
        },
    },



    events: [],
    instantEvents: [],
    slot: {},

    getScripts: function () {
        return ["moment.js"];
    },

    getStyles: function () {
        return ["font-awesome.css", "custom.css"];
    },

    start: function() {
        this.ready = 0;
        this.cfg = this.setConfig(this.data.config);
        this.redrawTimer = null;
        //this.config = this.reset(this.config, true);
    },
/*
    suspend: function() {
        this.ready = false;
    },

    resume: function() {
        this.ready = true;
        this.draw();
    },
*/

    setConfig: function(ncfg, template=this.defaultConfig) {
        var cfg = {};
        cfg.debug
            = (typeof ncfg.debug !== 'undefined')
            ? ncfg.debug : template.debug;
        cfg.show
            = (typeof ncfg.show !== 'undefined')
            ? ncfg.show : template.show;
        cfg.fullDayEventLocalize
            = (typeof ncfg.fullDayEventLocalize !== 'undefined')
            ? ncfg.fullDayEventLocalize : template.fullDayEventLocalize;
        cfg.locale
            = (typeof ncfg.locale !== 'undefined')
            ? ncfg.locale : config.language;
        cfg.redrawInterval
            = (typeof ncfg.redrawInterval !== 'undefined')
            ? ncfg.redrawInterval : template.redrawInterval;
        if (typeof ncfg.globalView !== 'undefined') {
            cfg.globalView
                = Object.assign({}, template.globalView, ncfg.globalView);

        } else {
            cfg.globalView = template.globalView;
        }
        var self = this;
        VIEWS.forEach(function(param) {
            if(typeof ncfg[param] !== 'undefined') {
                cfg[param]
                    = Object.assign(
                        {}, template[param], cfg.globalView, ncfg[param]
                    );
            } else {
                cfg[param] = Object.assign({}, template[param], cfg.globalView);
            }
            self.slot[param] = {
                mode: param,
                slotIndex: [],
                slot: []
            };
        });
        if (typeof ncfg.authDefault !== 'undefined') {
            cfg.authDefault = Object.assign(
                {}, template.authDefault, ncfg.authDefault
            );
        } else {
            cfg.authDefault = template.authDefault;
        }

        if (typeof ncfg.relativeConfig !== 'undefined') {
            cfg.relativeConfig = Object.assign(
                {}, template.relativeConfig, ncfg.relativeConfig
            );
        } else {
            cfg.relativeConfig = template.relativeConfig;
        }
        if (typeof ncfg.calendarDefault !== 'undefined') {
            cfg.calendarDefault = Object.assign (
                {}, template.calendarDefault, ncfg.calendarDefault
            );
        } else {
            cfg.calendarDefault = template.calendarDefault;
        }

        cfg.calendars = [];
        for (var i =0; i<ncfg.calendars.length; i++) {
            var nc = ncfg.calendars[i];
            var c = Object.assign({}, cfg.calendarDefault, nc);
            if (typeof nc.auth !== 'undefined') {
                c.auth = Object.assign({}, cfg.authDefault, nc.auth);
            }
            if (c.url !== null) {
                cfg.calendars.push(c);
            }
        }

        this.sendSocketNotification('CONFIG_SET');
        this.sendNotification('CALEXT_SAY_CONFIGURATION_SET');
        return cfg;
    },


    addCalendars: function() {
        for (var c in this.cfg.calendars) {
			this.addCalendar(this.cfg.calendars[c]);
		}
    },

    addCalendar: function (calendar, sender = SELFNAME, reqKey = null) {
        calendar.sender = sender;
        this.sendSocketNotification(
            "ADD_CALENDAR",
            {
                'calendar': calendar,
                'sender': sender,
                'reqKey': reqKey
            }
        );
        /*
        calendar.sender = sender;
        if (typeof calendar.url == 'undefined' || calendar.url == 'null') {
            var msg = "URL is missed.";
            console.log(msg);
            if (sender !== SELFNAME) {
                this.sendNotification(
                    'CALEXT_ADD_CALENDAR_FAIL',
                    {
                        'from': calendar.sender,
                        'url': calendar.url
                        'contents': msg
                    }
                );
            }
        }
        for (param in this.calendarDefaults) {
            if (typeof calendar[param] === 'undefined') {
                //when there is no config;
                calendar[param]
                    = (param == 'auth') ? null : this.calendarDefaults[param];
            } else {
                // when there is config
            }
        }
        calendar.httpUrl = calendar.url.replace("webcal://", "http://");
        calendar.uid = (calendar.sender + calendar.name + calendar.url).hashCode();
		this.sendSocketNotification("ADD_CALENDAR", calendar);
        */
	},

    getDom: function() {
        var wrapper = null;
        wrapper = document.createElement("div");
        wrapper.id = 'CALEXT_secret';
        wrapper.className = 'secret';

        if(!this.ready) return wrapper;

        var viewDom = {}
        var oldDom = {}
        var self = this;

        VIEWS.forEach(function(mode) {
            viewDom[mode]
                = (mode == 'month')
                ? self.getMonthDom(self.cfg[mode], self.slot[mode])
                : self.getSlotDom(mode, self.cfg[mode], self.slot[mode]);
            oldDom[mode] = document.getElementById('CALEXT_CONTAINER_' + mode);
        });

        this.cfg.show.forEach(function (mode){
            var position = self.cfg[mode].position;
            var hookDom = self.getRegionContainer(position);

            var originalDisplay = hookDom.style.display;
            var tricky = viewDom[mode].firstChild;
            var tRegion = tricky.childNodes[0];
            var tDisp = tricky.childNodes[1];
            tRegion.innerHTML = position;
            tDisp.innerHTML = originalDisplay;

            if(oldDom[mode]) {
                var oTricky = oldDom[mode].firstChild;
                var otRegion = oTricky.childNodes[0];
                var otDisp = oTricky.childNodes[1];
                var oldHookDom = self.getRegionContainer(otRegion.innerHTML);
                oldHookDom.style.display = otDisp.innerHTML;
                oldDom[mode].outerHTML = "";
                delete oldDom[mode];
            }

            hookDom.appendChild(viewDom[mode]);
            hookDom.style.display = 'block';
        });
        return wrapper;
    },

    dailyClassName: function(md) {
        var isNextMonth
            = (moment().format('MM') !== md.format('MM')) ? 1 : 0;
        var isLastDay
            = (md.format('d') == moment().endOf('month').format('d'))
                ? 1 : 0;
        var isToday
            = (moment().format('MMDD') == md.format('MMDD')) ? 1 : 0;
        var text = " daily weekday_" + md.format('E')
            + ((isNextMonth) ? " nextmonth" : "")
            + " monDate_" + md.format('MMDD')
            + " month_" + md.format('M')
            + " date_" + md.format('D')
            + ((isToday) ? " today" : "")
            + ((isLastDay) ? " lastday" : "");
        return text;
    },

    weeklyClassName: function(md) {
        var lc = this.cfg.locale;
        md = md.locale(lc);
        var now = moment().locale(lc);
        var isNextYear
            = (moment(now).format('gggg') !== md.format('gggg')) ? 1 : 0;
        var isLastWeek
            = (md.format('w') == 53) ? 1 : 0;
        var isThisWeek
            = (moment().format('ww') == md.format('ww')) ? 1 : 0;
        var text = " weekly weeks_" + md.format('w')
            + ((isNextYear) ? " nextyear" : "")
            + ((isThisWeek) ? " thisweek" : "")
            + ((isLastWeek) ? " lastweek" : "");
        return text;
    },

    monthlyClassName: function(md) {
        var isNextYear
            = (moment().format('YYYY') !== md.format('YYYY')) ? 1 : 0;
        var isLastMonth
            = (md.format('M') == 12) ? 1 : 0;
        var isThisMonth
            = (moment().format('M') == md.format('M')) ? 1 : 0;
        var text = " monthly months_" + md.format('M')
            + ((isNextYear) ? " nextyear" : "")
            + ((isThisMonth) ? " thismonth" : "")
            + ((isLastMonth) ? " lastmonth" : "");
        return text;
    },

    getHeaderDom: function(mode, cfg, d) {
        var lc = this.cfg.locale;
        var md = moment(parseInt(d));
        var headerWrapper = document.createElement("div");
        headerWrapper.className = "header";

        var headerTitleWrapper = document.createElement("div");
        headerTitleWrapper.className = "title";

        var headerSubtitleWrapper = document.createElement("div");
        headerSubtitleWrapper.className = "subtitle";

        var title = "";
        var subtitle = "";

        switch(mode) {
            case "upcoming":
                title = cfg.title;
                subtitle = '';
                break;
            case "monthly":
                title = (moment().format('YY') == md.format('YY'))
                    ? md.locale(lc).format(cfg.titleFormat)
                    : md.locale(lc).format(cfg.overTitleFormat);
                subtitle = md.locale(lc).format(cfg.subtitleFormat);
                break;
            case "weekly":
                title = (moment().format('gg') == md.format('gg'))
                    ? md.locale(lc).format(cfg.titleFormat)
                    : md.locale(lc).format(cfg.overTitleFormat);
                subtitle
                    = md.locale(lc).startOf('week').format(cfg.subtitleFormat)
                    + " - "
                    + md.locale(lc).endOf('week').format(cfg.subtitleFormat)
                break;
            case "daily":
                subtitle = md.locale(lc).format(cfg.subtitleFormat);
            case "month":
                title = (moment().format('MM') == md.format('MM'))
                    ? md.locale(lc).format(cfg.titleFormat)
                    : md.locale(lc).format(cfg.overTitleFormat);
                break;
        }
        headerTitleWrapper.innerHTML = title;
        headerSubtitleWrapper.innerHTML = subtitle;

        headerWrapper.appendChild(headerTitleWrapper);
        headerWrapper.appendChild(headerSubtitleWrapper);

        return headerWrapper;
    },

    eventPeriodString: function(mode, cfg, event) {
        var lc = this.cfg.locale;
        var sd = moment(parseInt(event.startDate));
        var ed = moment(parseInt(event.endDate));
        var text = "";

        if (mode == 'upcoming') {
            if(cfg.useRelative) {
                text = sd.locale(lc).calendar();
                return text;
            }
        }

        var isSameTime
            = (ed.format('YYMMDDHHmm') == sd.format('YYMMDDHHmm')) ? 1 : 0;
        var isSameDay
            = (ed.format('YYMMDD') == sd.format('YYMMDD')) ? 1 : 0;

        if(event.fullDayEvent) {
            var format = cfg.fullDayEventDateFormat;
            text = sd.locale(lc).format(format);
            text += (isSameDay) ? "" : (" - " + ed.locale(lc).format(format));
        } else {
            var timeFormat = cfg.timeFormat;
            var dateFormat = cfg.dateFormat;
            var end = "";
            var start = "";

            start = sd.locale(lc).format(dateFormat);
            start = ((mode !== 'daily' || !isSameDay) ? (start + " ") : "")
                + sd.locale(lc).format(timeFormat);

            end = " - "
                + ((isSameDay) ? "" : ed.locale(lc).format(dateFormat)) + " "
                + ed.locale(lc).format(timeFormat);

            end = (isSameTime) ? "" : end;

            text = start + end;
        }

        return text;
    },

    getEventsDom: function(mode, cfg, events, s, e) {
        var ms = moment(parseInt(s));
        var me = moment(parseInt(e));

        var eventsBoardWrapper = document.createElement("div");
        eventsBoardWrapper.className = "eventsBoard";

        var eventsWrapper = document.createElement("ul");
        eventsWrapper.className = "events";

        if(Array.isArray(events)) {
            var count = 0;
            var self = this;

            events.sort(function(a,b) {
                if(mode !== 'daily' || mode !== 'month') {
                    return ((a.startDate <= b.startDate) ? -1 : 1);
                }
                if (a.fullDayEvent !== b.fullDayEvent) {
                    return a.fullDayEvent ? -1 : 1;
                } else {
                    return ((a.startDate <= b.startDate) ? -1 : 1);
                }
            });

            events.forEach(function(event) {
                count++;
                var color = event.color;
                var sa = event.symbol.split('@');
                var symbol = sa[0];
                var symbolType = (typeof sa[1] !== 'undefined') ? sa[1] : 'fa';




                var eventWrapper = document.createElement("li");
                es = moment(parseInt(event.startDate));
                ee = moment(parseInt(event.endDate));
                eventWrapper.className = "event" + " symbol_" + symbol
                    + ((es.isBetween(ms, me, null, '[)')) ? " startHere" : "")
                    + ((ee.isBetween(ms, me, null, '(]')) ? " endHere" : "");

                var symbolWrapper = document.createElement("span");


                if (symbolType == 'mi') {
                    symbolWrapper.className
                        = "google-material-design symbol symbol_" + symbol;
                    symbolWrapper.innerHTML
                        = (mode == 'month')
                        ? "<i class='material-icons md-12'>" +symbol + "</i>"
                        : "<i class='material-icons'>" +symbol + "</i>";
                    symbolWrapper.style.color = event.color;
                } else {
                    symbolWrapper.className
                        = "fa-stack symbol symbol_" + symbol;
                    symbolWrapper.innerHTML
                        = "<i class='fa fa-circle fa-stack-2x'></i>"
                        + "<i class='fa fa-stack-1x fa-inverse fa-" + symbol + "'></i>";
                    symbolWrapper.style.color = event.inverseColor;
                }



                var eventContainerWrapper = document.createElement("div");
                eventContainerWrapper.className = "eventContainer";
                var eventTimeWrapper = document.createElement("div");
                eventTimeWrapper.className = "eventTime";
                var eventContentWrapper = document.createElement("div");
                eventContentWrapper.className = "eventContent";
                eventContentWrapper.innerHTML = (event.title).trunc(cfg.ellipsis);
                var eventLocationWrapper = document.createElement("div");
                eventLocationWrapper.className = "eventLocation";
                eventLocationWrapper.innerHTML
                    = event.location ? event.location : "";

                if (event.fullDayEvent) {
                    eventWrapper.className += " fulldayevent";
                    eventWrapper.style.backgroundColor = color;
                    symbolWrapper.style.color = event.inverseColor;
                    eventWrapper.style.color = event.inverseColor;
                }

                eventTimeWrapper.innerHTML = self.eventPeriodString(mode, cfg, event);


                if (cfg.showTime) {
                    eventContainerWrapper.appendChild(eventTimeWrapper);
                }

                eventContainerWrapper.appendChild(eventContentWrapper);

                if (cfg.showLocation) {
                    eventContainerWrapper.appendChild(eventLocationWrapper);
                }

                eventWrapper.appendChild(symbolWrapper);
                eventWrapper.appendChild(eventContainerWrapper);
                eventsWrapper.appendChild(eventWrapper);
            });
        }
        eventsBoardWrapper.appendChild(eventsWrapper);
        return eventsBoardWrapper;
    },

    getMonthDom: function(cfg, slots) {
        var showWeeks = cfg.showWeeks;
        var lc = this.cfg.locale;
        var days = [];
        var dayNames = [];

        var lb = 7;
        if (showWeeks) {
            var lb = 8;
            days.push('');
            dayNames.push(cfg.weeksTitle);
        }

        for(var i=0; i<7; i++) {
            var tday = moment(slots.slotIndex[i]).locale(lc);
            days.push(moment(tday).format('E'));
            dayNames.push(moment(tday).format(cfg.weekdayFormat));
        }
        var table = document.createElement("table");
        table.className = 'calendarMonth comumn_' + lb;
        var thead = document.createElement('thead');
        thead.className = 'calendarHead'
        var tr = document.createElement('tr');
        tr.className = 'weekHeader';

        for(var i=0; i<lb; i++) {
            var th = document.createElement('th');
            if (i==0) {
                th.className = (showWeeks) ? 'weekday_header' : 'weekday_' + days[i+1];
            } else {
                th.className
                    = (showWeeks)
                    ? 'weekday_' + days[i]
                    : 'weekday_' + days[i+1];
            }
            th.innerHTML = dayNames[i];
            tr.appendChild(th);
        }
        thead.appendChild(tr);
        table.appendChild(thead);

        for(i=0; i<slots.slot.length; i++) {
            var events = slots.slot[i];
            var d = moment(slots.slotIndex[i]).locale(lc);
            var now = moment().locale(lc);
            var isThisMonth = (moment(now).format('MM') == moment(d).format('MM')) ? 1 : 0;

            var isLastMonth
                = (moment(d).startOf('month').isBefore(moment(now).startOf('month')))
                ? 1 : 0;
            var isNextMonth
                = (moment(d).startOf('month').isAfter(moment(now).startOf('month')))
                ? 1 : 0;
            var isThisWeek = (moment(now).format('wo') == moment(d).format('wo')) ? 1 : 0;
            var isToday = (moment(now).format('MMDD') == moment(d).format('MMDD')) ? 1 : 0;
            if (i % 7 == 0) {
                var tr = document.createElement('tr');
                tr.className
                    = 'weeks weeks_' + moment(d).week()
                    + ((isThisWeek) ? ' thisweek' : '');

                if(showWeeks) {
                    var th = document.createElement('th');
                    th.innerHTML = moment(d).format(cfg.weeksFormat);
                    tr.appendChild(th);
                }
            }
            var td = document.createElement('td');
            td.className
                = 'day day_' + moment(d).format('d')
                + ' mon_' + moment(d).format('M')
                + ' date_' + moment(d).format('D')
                + ' monDate_' + moment(d).format('MMDD')
                + ' weekday_' + moment(d).format('E')
                + ((isThisMonth) ? ' thismonth' : '')
                + ((isLastMonth) ? ' lastmonth' : '')
                + ((isNextMonth) ? ' nextmonth' : '')
                + ((isToday) ? ' today' : '');

            td.appendChild(this.getHeaderDom('month', cfg, d.valueOf()));
            var mPeriod = moment(parseInt(slots.slotIndex[i]));
            var mPeriodEnd = moment(parseInt(slots.slotIndex[i + 1]));
            if (typeof events !== 'undefined') {
                td.appendChild(
                    this.getEventsDom(
                        'month',
                        cfg,
                        events,
                        mPeriod.valueOf(),
                        mPeriodEnd.valueOf()
                    )
                );
            }

            tr.appendChild(td);
            if (i % 7 == 6) {
                table.appendChild(tr);
            }
        }


        var wrapper = document.createElement("div");
        wrapper.id = SELFNAME + '_month';
        wrapper.className = "wrapper month";
        wrapper.appendChild(table);

        var container = document.createElement("div");
        container.className = "CALEXT";
        container.id = 'CALEXT_CONTAINER_month';
        var tricky = document.createElement('div');
        tricky.style.display = 'none';
        tricky.className = 'tricky';
        var region = document.createElement('div');
        var disp = document.createElement("div");
        tricky.appendChild(region);
        tricky.appendChild(disp);
        container.appendChild(tricky);
        container.appendChild(wrapper);
        return container;
    },

    getSlotDom: function(mode, cfg, slots) {
        var wrapper = document.createElement("div");
        wrapper.id = SELFNAME + '_' + mode;
        wrapper.className = "wrapper slots " + slots.mode;
        wrapper.style.flexDirection = cfg.direction;

        for(i=0; i<slots.slot.length; i++) {
            var events = slots.slot[i];
            var mPeriod = moment(parseInt(slots.slotIndex[i]));
            var mPeriodEnd = moment(parseInt(slots.slotIndex[i + 1]));

            var slotWrapper = document.createElement("div");
            slotWrapper.className = "slot slotid_" + slots.slotIndex[i];

            switch(mode) {
                case 'upcoming':
                    slotWrapper.className += ' upcoming';
                    break;
                case 'monthly':
                    slotWrapper.className += this.monthlyClassName(mPeriod);
                    break;
                case 'weekly' :
                    slotWrapper.className += this.weeklyClassName(mPeriod);
                    break;
                case 'daily':
                default:
                    slotWrapper.className += this.dailyClassName(mPeriod);
                    break;
            }


            slotWrapper.appendChild(
                this.getHeaderDom(mode, cfg, mPeriod.valueOf())
            );
            if (typeof events !== 'undefined') {
                slotWrapper.appendChild(
                    this.getEventsDom(
                        mode,
                        cfg,
                        events,
                        mPeriod.valueOf(),
                        mPeriodEnd.valueOf()
                    )
                );
            }
            wrapper.appendChild(slotWrapper);
        }

        var container = document.createElement("div");
        container.className = "CALEXT";
        container.id = 'CALEXT_CONTAINER_' + mode;
        var tricky = document.createElement('div');
        tricky.style.display = 'none';
        tricky.className = 'tricky';
        var region = document.createElement('div');
        var disp = document.createElement("div");
        tricky.appendChild(region);
        tricky.appendChild(disp);
        container.appendChild(tricky);
        container.appendChild(wrapper);
        return container;
    },



    prepareSlots: function(mode, cfg) {
        var lc = this.cfg.locale;
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
        var slots = [];
        slots.mode = mode;
        slots.slotIndex = [];
        slots.slot = [];
        slots.counts = cfg.counts;

        var start = moment();

        if (mode == 'upcoming') slots.counts = 1;
        if (mode == 'month') {
            var today = moment().locale(lc);
            //이번달은 몇개의 슬롯이 필요한가. 28,35,42
            var lastMonSlots = today.startOf('month').weekday();
            var thisMonSlots = today.daysInMonth();
            slots.counts = Math.ceil((lastMonSlots + thisMonSlots) / 7) * 7;

            start = today.startOf('month').weekday(0).startOf('day');
        }

        for (i = 0; i <= slots.counts; i++) {
            if (mode == 'upcoming') {
                slots.slotIndex.push(start.valueOf());
            } else {
                //daily, weekly, monthly
                slots.slotIndex.push(start.startOf(template[mode].p).valueOf());
            }

            if (i != slots.counts) {
                slots.slot[i] = [];
            }
            if (mode == 'upcoming') {
                start.add(100, 'year');
            } else {
                //daily, weekly, monthly
                start.add(1, template[mode].d);
            }
        }
        return slots;
    },

    fetchEvents: function(pl=null) {
        var self = this;
        var oldLimit = moment().startOf('month').startOf('week').startOf('day');



        var self = this;
        this.instantEvents = this.instantEvents.filter(function (e) {
            var uid = e.uid.split('@')[0];
            var msg = {
                message : "",
                uid : uid,
                sessionId : null,
                sender: e.sender,
            };
            var valid = moment(e.endDate).isAfter(oldLimit);
            console.log(valid, e.title, moment(e.endDate).format('YYMMDDHHmm'), oldLimit.format('YYMMDDHHmm'));
            if(!valid) {
                msg.message = e.uid;
                self.sendNotification('CALEXT_SAYS_USELESS_EVENT_REMOVED', msg);
            }
            return valid;
        });

        pl = (pl) ? pl : this.events;
        payload = pl.concat(this.instantEvents);

        this.initAfterLoading();

        payload.forEach(function (e){
            var eStart = moment(parseInt(e.startDate));
            var eEnd = moment(parseInt(e.endDate));

            if (oldLimit.isAfter(eEnd)) {
                //too old events.
            } else {

                eStart = moment(parseInt(e.startDate));
                eEnd = moment(parseInt(e.endDate));

                if (self.cfg.fullDayEventLocalize == 1) {
                    if (e.fullDayEvent == 1) {
                        var timegap = e.endDate - e.startDate - 1;
                        e.startDate = eStart.startOf('day').valueOf();
                        e.endDate = e.startDate + timegap;
                    }
                }
                for(var mode in self.slot) {
                    if((e.views.length !== 0) && (e.views.indexOf(mode) < 0)) {
                        continue;
                    }
                    var slots = self.slot[mode];

                    if (
                        mode == 'upcoming'
                        && slots.slot.length >= self.cfg[mode].counts
                    ) {
                        continue;
                    }
                    for (var i = 0; i < slots.slotIndex.length - 1; i++) {
                        var start = moment(parseInt(slots.slotIndex[i]));
                        var end = moment(parseInt(slots.slotIndex[i + 1]));

                        if (eEnd.isSameOrBefore(start) || eStart.isSameOrAfter(end)) {
                            //out of slot;
                        } else {
                            if(mode == 'upcoming') {
                                if(
                                    self.cfg[mode].counts > slots.slot[i].length
                                    && eStart.isAfter(start)
                                ) {
                                    slots.slot[i].push(e);
                                } else {
                                    ;//slot full;
                                }
                            } else {
                                slots.slot[i].push(e);
                            }
                        }
                    }
                    self.slot[mode] = slots;
                }
            }
        });
    },
    removeInstantEvent: function(eventUid, sender, sessionId) {
        var msg = {
            message : "",
            sessionId : sessionId,
            uid : null,
            sender : sender.name
        };
        var originIndex = this.instantEvents.length;
        var uid = ((eventUid) ? eventUid : sessionId) + '@' + sender.name;
        var self = this;
        var chkFlag = 0;
        this.instantEvents = this.instantEvents.filter(function (e) {
            var valid = (e.sender != sender.name) || (e.uid != uid);
            if(!valid) {
                msg.message = 'EVENT_REMOVED';
                msg.uid = e.uid;
                self.sendNotification('CALEXT_SAYS_REMOVE_EVENT_RESULT', msg);
                chkFlag = 1;
            }
            return valid;
        });
        if (!chkFlag) {
            msg.message = 'EVENT_NOT_REMOVED_UID_FAIL';
            msg.uid = eventUid;
            console.log('FAIL', eventUid);
            this.sendNotification('CALEXT_SAYS_REMOVE_EVENT_RESULT', msg);
        } else {
            this.draw();
        }
    },

    addInstantEvent: function(event, sender, sessionId) {
        var redraw = 0;
        var msg = {
            message : "",
            sessionId : sessionId,
            sender : sender.name
        }
        //없으면 새로 만들고, 있으면 변경, 100개 넘으면 too many.
        //100개 넘었는가?
        if(this.instantEvents.filter(function (e) {
            return e.sender == sender.name;
        }).length >= 100) {
            console.log('too many');
            msg.message = 'TOO_MANY_EVENTS';
            this.sendNotification('CALEXT_SAYS_ADD_EVENT_RESULT', msg);
        }

        //정규화
        var eDefault = {
                sender:null,
                uid: null,
                classes: [],
                views: [],
                color: this.cfg.calendarDefault.color,
                inverseColor: this.cfg.calendarDefault.inverseColor,
                symbol: this.cfg.calendarDefault.symbol,
                title: null,
                description: null,
                location: null,
                geo: null,
                startDate: moment().valueOf(),
                endDate: moment().valueOf(),
                fullDayEvent: 0,
            };

        for(var param in eDefault) {
            if (typeof event[param] === 'undefined') {
                event[param] = eDefault[param];
            }
        }
        event.uid = ((event.uid) ? event.uid : sessionId) + '@' + sender.name;
        event.sender = sender.name;
        //정규화 끝.

        //있나?
        var eArr = this.instantEvents.filter(function (e) {
            return (e.sender == sender.name)
                && (e.uid == event.uid);
        });
        var eOrigin = (eArr.length == 1) ? eArr[0] : null;

        if (!eOrigin) {
            this.instantEvents.push(event);
            msg.message = 'EVENT_ADDED';
            this.sendNotification('CALEXT_SAYS_ADD_EVENT_RESULT', msg);
            redraw = 1;
        } else {
            var chkChng = 0;
            for(var param in eOrigin) {
                if (typeof event[param] !== 'undefined') {
                    if (event[param] !== eOrigin[param]) {
                        eOrigin[param] = event[param];
                        chkChng = 1;
                    }
                } else {
                    //leave origin;
                }
            }
            if (chkChng) {
                msg.message = 'EVENT_UPDATED';
                this.sendNotification('CALEXT_SAYS_ADD_EVENT_RESULT', msg);
                redraw = 1;
            } else {
                msg.message = 'EVENT_NOT_UPDATED';
                this.sendNotification('CALEXT_SAYS_ADD_EVENT_RESULT', msg);
            }
        }
        if (redraw) {
            this.draw();
        }

    },

    notificationReceived: function(notification, payload, sender) {
        var sessionId = moment().valueOf();
        if (typeof payload !== 'undefined') {
            if (typeof payload.sessionId !== 'undefined') {
                sessionId = payload.sessionId;
            }
        }

        switch (notification) {
            case 'DOM_OBJECTS_CREATED':
                this.initAfterLoading();
                this.addCalendars();
                break;
            case 'CALEXT_ADD_EVENT':
                if(typeof payload.event !== 'undefined') {
                    this.addInstantEvent(payload.event, sender, sessionId);
                }
                break;
            case 'CALEXT_REMOVE_EVENT':
                if(typeof payload.uid !== 'undefined') {
                    this.removeInstantEvent(payload.uid, sender, sessionId);
                }
                break;
        }
    },

    socketNotificationReceived: function(notification, payload) {
        switch (notification) {
            case 'CALENDAR_MODIFIED':
                this.events = payload;
                this.draw();
                break;
            case 'REGISTER_CALENDAR_FAIL':
                if (payload.sender !== SELFNAME) {
                    sendNotification(
                        'CALEXT_SAY_REGISTER_CALENDAR_FAIL',
                        {
                            'message': payload.msg,
                            'sender': payload.sender,
                            'reqKey': payload.reqKey
                        }
                    );
                }
                break;
            case 'REGISTER_CALENDAR_SUCCESS':
                if (payload.sender !== SELFNAME) {
                    sendNotification(
                        'CALEXT_SAY_REGISTER_CALENDAR_SUCCESS',
                        {
                            'uid': payload.uid,
                            'sender': payload.sender,
                            'reqKey': payload.reqKey
                        }
                    );
                }
                break;
            case 'READY_TO_ADD_CALENDAR':
//                sendNotification('CALEXT_SAY_BE_READY')
//                this.addCalendars();
                break;
        }
    },

    getRegionContainer(regionName) {
        var className = regionName.replace("_", " ");
        className = "region " + className;
        var nodes = document.getElementsByClassName(className);
        if (nodes.length !== 1) return 0;
        var container = nodes[0].querySelector('.container');
        return container;
    },

    initAfterLoading() {
        var self = this;
        VIEWS.forEach(function(param) {
            self.slot[param] = self.prepareSlots(param, self.cfg[param]);
        });
        this.ready = 1;
        var cssId = 'googleMaterialDesignIcon';
        if (!document.getElementById(cssId))
        {
            var head  = document.getElementsByTagName('head')[0];
            var link  = document.createElement('link');
            link.id   = cssId;
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            link.media = 'all';
            head.appendChild(link);
        }
    },

    hideOriginal: function() {
        if (this.config.hideOriginal) {
            var modules = MM.getModules();
            var original = document.getElementsByClassName(
                    "module " + this.config.originalSender
                );
            if(original.length >= 1) {
                original[0].style.display = 'none';
            }
        }
    },

    draw: function() {
        this.fetchEvents();
        this.updateDom();
        this.rollOverflow();
        var self = this;
        clearInterval(this.redrawTimer);
        this.redrawTimer = null;
        var redrawInterval = null;
        if (typeof this.cfg.redrawInterval !== 'undefined') {
            redrawInterval = this.cfg.redrawInterval;
        }
        if (redrawInterval < 60000) {
            redrawInterval = 1*60*1000;
        }

        this.redrawTimer = setInterval(function() {
            self.draw();
        }, redrawInterval);
    },

    rollOverflow: function() {
        var self = this;
        VIEWS.forEach(function(mode) {
            var cfg = self.cfg[mode];
            if (cfg.overflowRolling !== 1) {
                return 0;
            }
            var height = cfg.overflowHeight;
            var dom = document.getElementById('CALEXT_CONTAINER_' + mode);
            if (typeof dom === 'undefined' || dom == null) return 0;
            var eventBoards = dom.getElementsByClassName('eventsBoard');

            if (typeof eventBoards === 'undefined' || eventBoards == null) return 0;

            var nodes = [].slice.call(eventBoards);

            nodes.forEach(function(node){
                if (height < node.clientHeight) {
                    node.className = "eventsBoard overflowed";
                    node.style.height = height + "px";
                    var copieshack = [].slice.call(node.childNodes);
                    var duration = copieshack[0].childNodes.length * cfg.overflowDuration;
                    copieshack.forEach(function(n){
                        n.style.animationDuration = duration + 's';
                        node.appendChild(n.cloneNode(1));
                    });
                } else {
                    node.className = "eventsBoard";
                }
            });
        });
    },

    _debug: function() {
        if (this.cfg.debug) {
            console.log(arguments);
        }
    }
});

String.prototype.hashCode = String.prototype.hashCode || function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return (hash >>> 0);
};

String.prototype.trunc = String.prototype.trunc || function(n){
    if (n < 10) return this;
    return (this.length > n) ? this.substr(0, n-1) + '&hellip;' : this;
};
