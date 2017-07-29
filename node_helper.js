const fs = require('fs');
const path = require('path');
const validUrl = require("valid-url");
//const Fetcher = require("./fetcher.js");

var Calendars = require('./components/Calendars.js');

var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
    events : [],

    start: function () {
        this.events = [];
        this.calendars = new Calendars();
        this.Pubsub = require('./components/Pubsub.js');

        var self = this;
        this.Pubsub.on('CALENDAR_MODIFIED', function(){
            var eventsArray = self.calendars.getAllEvents();

            eventsArray.sort(function(a,b) {
                return a.startDate - b.startDate;
            });
            self.sendSocketNotification('CALENDAR_MODIFIED', eventsArray);
        }, self);
    },

    socketNotificationReceived: function (noti, payload) {
        console.log('NOTI FROM Front', noti);
        switch (noti) {
            case 'ADD_CALENDAR':
                this.cmd_ADD_CALENDAR(
                    payload.calendar,
                    payload.sender,
                    payload.reqKey
                );
                break;
        }

    },

    cmd_ADD_CALENDAR: function(calConfig, sender, reqKey=null) {
        var self = this;
        var uid;
        //try {
            uid = this.calendars.registerCalendar(calConfig, sender, 1);
        //} catch (e) {
        //    console.log('REGISTER_CALENDAR_FAIL:', sender, reqKey, e.message);
    //        this.sendSocketNotification('REGISTER_CALENDAR_FAIL', {
    //            'message':e,
    //            'calendar': calConfig,
    //            'sender': sender,
    //            'reqKey': reqKey
        //    });
        //    return;
        //} finally {
            //do nothing;
        //}
/*
        this.sendSocketNotification('REGISTER_CALENDAR_SUCCESS', {
            'calendar': calConfig,
            'sender': sender,
            'uid': uid,
            'reqKey': reqKey
        });
*/
    }
});
