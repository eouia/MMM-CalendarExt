# ical.js #
(Formerly node-ical)

[![Build Status](https://travis-ci.org/peterbraden/ical.js.png)](https://travis-ci.org/peterbraden/ical.js)

A tolerant, minimal icalendar parser for javascript/node
(http://tools.ietf.org/html/rfc5545)

<a target='_blank' rel='nofollow' href='https://app.codesponsor.io/link/EQ7CNg8Bk6jMVXt4GPMe3bMH/peterbraden/ical.js'>
  <img alt='Sponsor' width='888' height='68' src='https://app.codesponsor.io/embed/EQ7CNg8Bk6jMVXt4GPMe3bMH/peterbraden/ical.js.svg' />
</a>

## Install - Node.js ##

ical.js is availble on npm:

    npm install ical



## API ##

    ical.parseICS(str)

Parses a string with an ICS File

    var data = ical.parseFile(filename)
    
Reads in the specified iCal file, parses it and returns the parsed data

    ical.fromURL(url, options, function(err, data) {} )

Use the request library to fetch the specified URL (```opts``` gets passed on to the ```request()``` call), and call the function with the result (either an error or the data).



## Example 1 - Print list of upcoming node conferences (see example.js)
```javascript
    var ical = require('ical')
  , months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    ical.fromURL('http://lanyrd.com/topics/nodejs/nodejs.ics', {}, function(err, data) {
      for (var k in data){
        if (data.hasOwnProperty(k)) {
          var ev = data[k]
          console.log("Conference",
            ev.summary,
            'is in',
            ev.location,
            'on the', ev.start.getDate(), 'of', months[ev.start.getMonth()]);
        }
      }
    });
```
## Recurrences and Exceptions ##
Calendar events with recurrence rules can be significantly more complicated to handle correctly.  There are three parts to handling them:

 1. rrule - the recurrence rule specifying the pattern of recurring dates and times for the event.
 2. recurrences - an optional array of event data that can override specific occurrences of the event.
 3. exdate - an optional array of dates that should be excluded from the recurrence pattern.

See example_rrule.js for an example of handling recurring calendar events.
