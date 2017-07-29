//var CalendarEvent = require('./CalendarEvent.js');

class CalendarEvents {
    constructor(limit=null, uidSeed=null) {
        this.limit = limit;
        this.uidSeed = uidSeed;

        this.events = [];
        this.uidIndex = [];
    }

    getAllEvents() {
        return this.events;
    }

    addEvent(eventObject) {
        if(!this.isLimitFull()) {
            this.events.push(eventObject);
            return {
                result:1,
                length:this.events.length
            };
        } else {
            return {
                result:0,
                length:this.events.length
            };
        }
    }

    isLimitFull() {
        return (this.events.length >= this.limit);
    }

    isSame(eArray) {
        if (typeof eArray === 'undefined' || !eArray) {
            return 0;
        }
        if (typeof this.events === 'undefined' || !this.events) {
            return 0;
        }
        if (this.events.length !== eArray.length) {
            return 0;
        }
        this.reindex();
        var self = this;
        for(var i=0; i<eArray.length; i++) {
            var e = eArray[i];
            var idx = this.uidIndex.indexOf(e.uid);
            if(idx >= 0) {
                var se = self.events[idx];
                if (se.title && e.title && se.title !== e.title) return 0;
                if (se.startDate && e.startDate && se.startDate !== e.startDate) return 0;
                if (se.endDate && e.endDate && se.endDate !== e.endDate) return 0;
                if (se.location && e.location && se.location !== e.location) return 0;
                if (se.geo && e.geo) {
                    if (se.geo.lat !== e.geo.lat || se.geo.lon !== e.geo.lon) return 0;
                }
                if (se.description && e.description && se.description !== e.description) return 0;
            } else {
                return 0;
            }
        }
        return 1;
    }

    reindex() {
        this.uidIndex = [];
        for (var i=0; i<this.events.length; i++) {
            var e = this.events[i];
            this.uidIndex.push(e.uid);
        }
    }

    resetEvents(eArray) {
        this.events = [];
        for(var i in eArray) {
            this.events.push(eArray[i]);
        }
        this.reindex();
    }
}

module.exports = CalendarEvents;
