String.prototype.hashCode = function() {
	var hash = 0, i, chr
	if (this.length === 0) {
		return hash
	}
	for (i = 0; i < this.length; i++) {
		chr   = this.charCodeAt(i)
		hash  = ((hash << 5) - hash) + chr
		hash |= 0; // Convert to 32bit integer
	}
	return String((hash >>> 0))
}

var iCal = require("../vendor/ical.js")
//var iCal = require("ical")
//var iCal = require("./ical.js")
var moment = require("moment")
var Pubsub = require("./Pubsub.js")

function Calendar (calConfig, sender=null, autostart=0) {
	this.type = "static"
	this.autostart = autostart
	this.sender = sender
	this.config = calConfig
	this.name = this.config.name
	this.timestamp = moment().format("x")
	this.timer = null
	//this.replace = null

	this.status = {
		state : "not fetched yet",
		lastFetchedTime : null,
		lastFetchedEvents : null,
		lastFetchedOldEvents : null,
		lastServedEvents : null,
		error: null
	}
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

	//this.uid = (this.sender + this.name + this.httpUrl).hashCode()
	this.uid = this.httpUrl
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
	self.status.state = "fetching"

	iCal.fromURL(this.httpUrl, this.opts, function(err, data) {
		if (err) {
			console.log("Error in iCal Parsing.")
			console.log(self.opts)
			console.log(err)
			self.nonewEvents([])
			return
		}
		var events = []
		var oldEvents = []
		var eventDate = function(event, time) {
			return (event[time].length === 8)
				? moment(event[time], "YYYYMMDD").startOf("day")
				: moment(event[time])
		}
		var now = moment()
		var today = moment().startOf("day")
		var past = moment().startOf("month").startOf("week").startOf("day")
		var future = moment().add(self.config.maxDays - 1, "days").endOf("day")

		// parsed item iteration
		for (var e in data) {
			var event = data[e]
			//var now = moment()
			//var today = moment().startOf("day")
			var title = "Unknown Event"
			var description = ""
			var location = null
			var geo = null
			var uid = null
			var isFulldayEvent = 0
			var startDate = null
			var endDate = null
			// start of VEVENT
			if (event.type === "VEVENT") {

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
						= (title + moment(event.start).format("x")).hashCode()
						+ "@" + this.uid
				} else {
					uid = event.uid
				}

				// Get the start and end dates from the event.  If the end date is undefined,
				// assume the event starts and ends on the same day.
				startDate = eventDate(event, "start");
				if (typeof event.end !== "undefined") {
					endDate = eventDate(event, "end");
				} else {
					endDate = startDate;
				}

				// calculate the duration of the event for use with recurring events.
				var duration = parseInt(endDate.format("x")) - parseInt(startDate.format("x"));

				// If the start date has a date but no time, assume it"s intended to start
				// at the start of the day.
				if (event.start.length === 8) {
					startDate = startDate.startOf("day");
				}

				//RRULE exists? It means recurred.
				if (typeof event.rrule !== "undefined") {

					var addedEvents = 0;

					// For recurring events, get the set of start dates that fall within the range
					// of dates we"re looking for.
					var dates = event.rrule.between(
						past.toDate(),
						future.toDate(),
						true,
						function(date, i) {return true;}
					)

					// The "dates" array contains the set of dates within our desired date range range that are valid
					// for the recurrence rule.  *However*, it"s possible for us to have a specific recurrence that
					// had its date changed from outside the range to inside the range.  For the time being,
					// we"ll handle this by adding *all* recurrence entries into the set of dates that we check,
					// because the logic below will filter out any recurrences that don"t actually belong within
					// our display range.
					// TODO: Find a better way to handle this.
					if (event.recurrences != undefined)
					{
						var pastMoment = moment(past);
						var futureMoment = moment(future);

						for (var r in event.recurrences)
						{
							// Only add dates that weren"t already in the range we added from the rrule so that
							// we don"t double-add those events.
							if (moment(new Date(r)).isBetween(pastMoment, futureMoment) != true)
							{
								dates.push(new Date(r));
							}
						}
					}

					// Loop through the set of date entries to see which recurrences should be added to our event list.
					for(var i in dates) {

						var date = dates[i];
						var curEvent = event;
						var showRecurrence = true;

						startDate = moment(date);

						// For each date that we"re checking, it"s possible that there is a recurrence override for that one day.
						if ((curEvent.recurrences != undefined) && (curEvent.recurrences[date.toISOString()] != undefined))
						{
							// We found an override, so for this recurrence, use a potentially different title, start date, and duration.
							curEvent = curEvent.recurrences[date.toISOString()];
							startDate = moment(curEvent.start);
							duration = parseInt(moment(curEvent.end).format("x")) - parseInt(startDate.format("x"));
						}
						// If there"s no recurrence override, check for an exception date.  Exception dates represent exceptions to the rule.
						else if ((curEvent.exdate != undefined) && (curEvent.exdate[date.toISOString()] != undefined))
						{
							// This date is an exception date, which means we should skip it in the recurrence pattern.
							showRecurrence = false;
						}

						endDate = moment(parseInt(startDate.format("x")) + duration, "x");
						var recurrenceTitle = getTitleFromEvent(curEvent);

						// If this recurrence ends before the start of the date range, or starts after the end of the date range, don"t add
						// it to the event list.
						if (endDate.isBefore(past) || startDate.isAfter(future)) {
							showRecurrence = false;
						}

						if ((showRecurrence === true) && (addedEvents < self.config.maxEntries)) {

							addedEvents++;

							var et = {
								"uid": uid + ":" + i,
								"name": self.name,
								"profiles": self.config.profiles,
								"views": self.config.views,
								"symbol": self.config.symbol,
								"styleName": self.config.styleName,
								"replaceTitle": self.config.replaceTitle,
								"classPattern" : self.config.classPattern,
								"classPatternWhere" : self.config.classPatternWhere,
								"symbolPattern" : self.config.symbolPattern,
								"symbolPatternWhere" : self.config.symbolPatternWhere,
								"ellipsis": self.config.ellipsis,
								"oneLineEvent": self.config.oneLineEvent,
								"title": recurrenceTitle,
								"description": description,
								"location": location,
								"geo": geo,
								"startDate": startDate.format("x"),
								"endDate": endDate.format("x"),
								"fullDayEvent": isFullDayEvent(curEvent),
								"firstOccurrence": moment(event.start).format("x"),
								"recurred": 1,
								"occurrence": i
							}

							if (startDate.isBefore(now) && endDate.isBefore(now)) {
								oldEvents.push(et)
							} else {
								events.push(et)
							}
						}

					} //iteration of rrule
				//recurred event fetch over
				} else {
					//single
					startDate = moment(event.start)
					if (typeof event.end !== "undefined") {
						//event.end exists.
						endDate = moment(event.end)
					} else {
						//event.end doesn"t exist mean FulldayEvent.
						if (typeof event.duration !== "undefined") {
							//event.end doesn"t exist, but duration exists.
							endDate = moment(startDate).add(moment.duration(event.duration))
						} else {
							//event.end and duration don"t exist.
							endDate = moment(startDate)
							isFulldayEvent = 1
						}
					}
					if(
						(startDate.format("HHmmss") == "000000")
						&& (endDate.format("HHmmss") == "000000")
					) {
						isFulldayEvent = 1
					}

					if (startDate.isBefore(past) || endDate.isAfter(future)) {
						continue
					}

					var et = {
						"uid": uid,
						"name": self.name,
						"profiles": self.config.profiles,
						"views": self.config.views,
						"styleName": self.config.styleName,
						"replaceTitle": self.config.replaceTitle,
						"classPattern" : self.config.classPattern,
						"classPatternWhere" : self.config.classPatternWhere,
						"symbolPattern" : self.config.symbolPattern,
						"symbolPatternWhere" : self.config.symbolPatternWhere,
						"symbol": self.config.symbol,
						"ellipsis": self.config.ellipsis,
						"oneLineEvent": self.config.oneLineEvent,
						"title": title,
						"description": description,
						"location": location,
						"geo": geo,
						"startDate": startDate.format("x"),
						"endDate": endDate.format("x"),
						"fullDayEvent": isFulldayEvent,
						"firstOccurrence": null,
						"recurred": 0,
						"occurrence": 0
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
			// end of "VEVENT"
			else {
				//console.log(e)
				//do nothing;
			}
			//end of events not "VEVENT"
		}
		// end of iteration each data

		events.sort(function(a, b) {
			return a.startDate - b.startDate
		})
		self.status.state = "fetched"
		self.status.lastFetchedTime = moment().format("YY-MM-DD HH:mm:ss")
		self.status.lastFetchedEvents = events.length
		self.status.lastFetchedOldEvents = oldEvents.length
		events = events.slice(0, self.config.maxEntries)
		var finalEvents = events.concat(oldEvents)
		finalEvents.sort(function(a, b) {
			return a.startDate - b.startDate
		})
		self.status.lastServedEvents = finalEvents.length
		if(events !== "undefined" && finalEvents.length > 0) {
			if(self.isEventsChanged(finalEvents)) {
				self.renewEvents(finalEvents)
				self.status.state = "renewed"
			} else {
				self.nonewEvents(finalEvents)
				self.status.state = "fetched but no change"
			}
		}

		console.log("[CALEXT]",self.httpUrl, " >> ")
		console.log(self.status)
	})
	// iCal end.
}

/* getTitleFromEvent(event)
* Gets the title from the event.
*
* argument event object - The event object to check.
*
* return string - The title of the event, or "Event" if no title is found.
*/
var getTitleFromEvent = function (event) {
	var title = "Event";
	if (event.summary) {
		title = (typeof event.summary.val !== "undefined") ? event.summary.val : event.summary;
	} else if (event.description) {
		title = event.description;
	}

	return title;
};

/* isFullDayEvent(event)
* Checks if an event is a fullday event.
*
* argument event obejct - The event object to check.
*
* return bool - The event is a fullday event.
*/
var isFullDayEvent = function(event) {
	if (event.start.length === 8) {
		return 1;
	}

	var start = event.start || 0;
	var startDate = new Date(start);
	var end = event.end || 0;

	if (end - start === 24 * 60 * 60 * 1000 && startDate.getHours() === 0 && startDate.getMinutes() === 0) {
		// Is 24 hours, and starts on the middle of the night.
		return 1;
	}

	return 0;
};

Calendar.prototype.isEventsChanged = function(eArray) {
	if (typeof eArray == "undefined") return 0
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
	this.timestamp = moment().format("x")
	Pubsub.emit("CALENDAR_MODIFIED")
}

Calendar.prototype.nonewEvents = function(eArray) {
	Pubsub.emit("CALENDAR_FETCHED_BUT_NOT_MODIFIED")
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
