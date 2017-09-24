const fs = require('fs')
const path = require('path')
const validUrl = require('valid-url')
const Pubsub = require('./components/Pubsub.js')
// const Fetcher = require("./fetcher.js");

var Calendars = require('./components/Calendars.js')

var NodeHelper = require('node_helper')

module.exports = NodeHelper.create({
  events: [],

  start: function () {
    this.events = []
    this.calendars = new Calendars()

    var self = this
    Pubsub.on('CALENDAR_MODIFIED', function () {
      var eventsArray = self.calendars.getAllEvents()

      eventsArray.sort(function (a, b) {
        return a.startDate - b.startDate
      })
      self.sendSocketNotification('CALENDAR_MODIFIED', eventsArray)
    }, self)

    Pubsub.on('ALL_CALENDARS_RESET', function() {
      self.sendSocketNotification('READY_TO_ADD_CALENDAR')
    })
  },

  socketNotificationReceived: function (noti, payload) {
    switch (noti) {
      case 'ADD_CALENDAR':
        this.cmd_ADD_CALENDAR(payload.calendar, payload.sender, payload.reqKey)
        break
      case 'RESET_CALENDARS':
        this.cmd_RESET_CALENDARS()
        break;
    }
  },

  cmd_ADD_CALENDAR: function (calConfig, sender, reqKey = null) {
    this.calendars.registerCalendar(calConfig, sender, 1)
  },
  cmd_RESET_CALENDARS: function() {
    this.calendars.resetCalendars()
  },
})
