String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return String((hash >>> 0));
};

checkUrlExists = function (Url, callback) {
    var options = {
        method: 'HEAD',
        host: url.parse(Url).host,
        port: 80,
        path: url.parse(Url).pathname
    };
    var req = http.request(options, function (r) {
        callback(r.statusCode== 200);
    });
    req.end();
}
var http = require('http');
var url = require('url');
var iCal = require('../vendor/ical.js');
var moment = require('moment');
var Pubsub = require('./Pubsub.js');
var CalendarEvents = require('./CalendarEvents.js');

class Calendar {
    constructor (calConfig, sender=null, autoStart=0) {
        this.type = 'static';
        this.sender = sender;
        this.config = calConfig;
        this.name = this.config.name;
        this.timestamp = moment().format('x');
        this.timer = null;
        this.replace = null;

        this.status = {
            state : 'not fetched yet',
            lastFetchedTime : null,
            lastFetchedEvents : null,
            lastFetchedOldEvents : null,
            lastServedEvents : null,
            error: null
        };

        if(typeof this.config.replace === 'undefined') {
            this.replace = [];
        } else {
            this.replace = this.config.replace;
        }

        this.httpUrl = this.config.url.replace("webcal://", "http://");
        var self = this;
        /*
        checkUrlExists(this.httpUrl, function(err, exists){ //this is not good.
            if (err || !exists) {
                var msg = "This calendar has invalid URL. : " + self.config.url;
                throw new Error(err);
            }
            return exists;
        });
        */
        this.opts = null;

        var nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
        this.opts = {
            "headers" : {
                "User-Agent":
                    "Mozilla/5.0 (Node.js "
                    + nodeVersion + ") MagicMirror/"
                    + global.version
                    + " (https://github.com/MichMich/MagicMirror/)"
            }
        };
        if (this.config.auth) {
    		if(this.config.auth.method === "bearer"){
    			this.opts.auth = {
    				bearer: this.config.auth.pass
    			}
    		} else {
    			this.opts.auth = {
    				user: this.config.auth.user,
    				pass: this.config.auth.pass
    			};
    			if(this.config.auth.method === "digest"){
    				this.opts.auth.sendImmediately = 0;
    			}else{
    				this.opts.auth.sendImmediately = 1;
    			}
    		}
    	}

        this.uid = (this.sender + this.name + this.httpUrl).hashCode();
        this.events = new CalendarEvents(this.config.maxEntries, this.uid);

        //this.fetcher = new Fetcher(this);
        if (autoStart) {
            this.fetch();
            this.activate();
        }
    }

    fetch() {
        //ical start
        console.log("[CALEXT]",this.httpUrl, " >> Fetch starts.");
        var self = this;
        self.status.state = 'fetching';

        iCal.fromURL(this.httpUrl, this.opts, function(err, data) {
            if (err) {
                console.log('Error in iCal Parsing.');
                console.log(self.opts);
                console.log(err);
                self.nonewEvents([]);
                return;
            }
            var events = [];
            var oldEvents = [];
            var eventDate = function(event, time) {
                return
                    (event[time].length === 8)
                        ? moment(event[time], "YYYYMMDD").startOf('day')
                        : moment(event[time]);
            };
            var now = moment();
            var today = moment().startOf("day");
            var past = moment().startOf('month').startOf('week').startOf('day');
            var future
                = moment()
                .add(self.config.maxDays - 1, "days")
                .endOf("day");

            // parsed item iteration
            for (var e in data) {
                var event = data[e];
                //var now = moment();
                //var today = moment().startOf('day');
                var title = "Unkonwn Event";
                var description = "";
                var location = null;
                var geo = null;
                var uid = null;
                var isFulldayEvent = 0;
                var startDate = null;
                var endDate = null;
                // start of VEVENT
                if (event.type === 'VEVENT') {
                    if (event.summary) {
                        title
                            = (typeof event.summary.val !== "undefined")
                            ? event.summary.val
                            : event.summary;
                    } else if (event.description) {
                        title = event.description;
                    }
                    if (
                        typeof self.replace !== 'undefined'
                        && self.replace.length > 0
                    ) {

                        for(var i=0; i<self.replace.length; i++) {
                            var replace = self.replace[i];
                            if(
                                typeof replace.from !== 'undefined'
                                && typeof replace.to !== 'undefined'
                            ) {
                                var from = replace.from;
                                var to = replace.to;
                                title = title.replace(new RegExp(from, 'g'), to);
                            } else {
                            }
                        }
                    } else {
                        //do nothing;
                    }

                    location = event.location || null;
                    geo = event.geo || null;
                    description = event.description || null;

                    if (!event.uid) {
                        uid
                            = (title + moment(event.start).format('x')).hashCode()
                            + '@' + this.uid;
                    } else {
                        uid = event.uid;
                    }

                    //RRULE exists? It means recurred.
                    if (typeof event.rrule !== 'undefined') {
                        //recurring; event.endDate is useless.
                        event.rrule.all(function(date, i) {
                            var dt = moment(date);
                            if (dt.isBefore(past) || dt.isAfter(future)) {
                                return 0;
                            }

                            var endDate = null;
                            var startDate = moment(dt);
                            if (typeof event.duration !== 'undefined') {
                                var duration = moment.duration(event.duration);
                                endDate = moment(startDate).add(duration);
                                if(
                                    (startDate.format('HHmmss') == '000000')
                                    && (endDate.format('HHmmss') == '000000')
                                ) {
                                    isFulldayEvent = 1;
                                }
                            } else {
                                endDate = moment(startDate);
                                isFulldayEvent = 1;
                            }

                            var et = {
                                'uid': uid + ':' + i,
                                'name': self.name,
                                'profiles': self.config.profiles,
                                'views': self.config.views,
                                'color': self.config.color,
                                'inverseColor': self.config.inverseColor,
                                'symbol': self.config.symbol,
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
                                oldEvents.push(et);
                            } else {
                                events.push(et);
                            }

                        }); //iteration of rrule;
                    //recurred event fetch over;
                    } else {
                        //single;
                        startDate = moment(event.start);
                        if (typeof event.end !== 'undefined') {
                            //event.end exists.
                            endDate = moment(event.end);
                        } else {
                            //event.end doesn't exist mean FulldayEvent.
                            if (typeof event.duration !== 'undefined') {
                                //event.end doesn't exist, but duration exists.
                                endDate = moment(startDate).add(
                                    moment.duration(event.duration)
                                );
                            } else {
                                //event.end and duration don't exist.
                                endDate = moment(startDate);
                                isFulldayEvent = 1;
                            }
                        }
                        if(
                            (startDate.format('HHmmss') == '000000')
                            && (endDate.format('HHmmss') == '000000')
                        ) {
                            isFulldayEvent = 1;
                        }

                        if (startDate.isBefore(past) || endDate.isAfter(future)) {
                            continue;
                        }

                        var et = {
                            'uid': uid,
                            'name': self.name,
                            'profiles': self.config.profiles,
                            'views': self.config.views,
                            'color': self.config.color,
                            'inverseColor': self.config.inverseColor,
                            'symbol': self.config.symbol,
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
                        };
                        if (startDate.isBefore(now)) {
                            oldEvents.push(et);
                        } else {
                            events.push(et);
                        }
                        // finish check fulldayevent and parsing startDate, endDate
                    }
                    // single event fetch over
                }
                // end of 'VEVENT';
                else {
                    //console.log(e);
                }
                //end of events not 'VEVENT'
            }
            // end of iteration each data;

            events.sort(function(a, b) {
                return a.startDate - b.startDate;
            });
            self.status.state = 'fetched';
            self.status.lastFetchedTime = moment().format('x');
            self.status.lastFetchedEvents = events.length;
            self.status.lastFetchedOldEvents = oldEvents.length;
            events = events.slice(0, self.config.maxEntries);
            var finalEvents = events.concat(oldEvents);
            finalEvents.sort(function(a, b) {
                return a.startDate - b.startDate;
            });
            self.status.lastServedEvents = finalEvents.length;
            if(events !== 'undefined' && finalEvents.length > 0) {
                if(self.isEventsChanged(finalEvents)) {
                    self.renewEvents(finalEvents);
                    self.status.state = 'renewed';
                } else {
                    self.nonewEvents(finalEvents);
                    self.status.state = 'fetched but no change';
                }
            }

            console.log("[CALEXT]",self.httpUrl, " >> ");
            console.log(self.status);
        });

        // iCal end.
    }

    isEventsChanged(eArray) {
        if(typeof eArray !== 'undefined' && eArray.length > 0) {
            return !this.events.isSame(eArray);
        } else {
            return 0;
        }
    }

    renewEvents(eArray) {
        this.events.resetEvents(eArray);
        this.timestamp = moment().format('x');
        Pubsub.emit('CALENDAR_MODIFIED');
        //console.log(this.events);
    }

    nonewEvents(eArray) {
        Pubsub.emit('CALENDAR_FETCHED_BUT_NOT_MODIFIED');
    }

    getAllEvents() {
        return this.events.getAllEvents();
    }

    suicide() {
      this.events = null;
      
    }

    activate () {
      clearInterval(this.timer);
      var self = this;
      this.timer = setInterval(function() {
          self.fetch();
      }, this.config.interval);
    }

    deactivate () {
        clearInterval(this.timer);
        this.timer = null;
    }

    errorCallback() {

    }
}



module.exports = Calendar;
