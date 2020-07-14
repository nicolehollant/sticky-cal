const { DateTime, Interval } = require('luxon')
const ical = require('node-ical');

/**
* [ **week** ]
* - Closure containing information about your current week
* @param {Array<Object>} paths - The path to the ics file to parsed
* @param {DateTime} from - The datetime corresponding to the weel
* @returns {object} - An object containing relevant info
*/
const week = (paths, from = DateTime.local()) => {
  // console.log(from.weekday, from.weekday === 7)
  const weekstart = from.weekday === 7 ? from.set({ weekday: 7, hour: 0, minute: 0, second: 0, millisecond: 0 })
    : from.set({ weekday: 0, hour: 0, minute: 0, second: 0, millisecond: 0 }) // beginning of current week
  const weekend = weekstart.plus({days: 7}).minus({milliseconds: 1}) // end of current week
  const weekInterval = Interval.fromDateTimes(weekstart, weekend) // interval spanning current week
  const weekEvents = {
    0: {
      date: weekstart.plus({days: 0}),
      events: []
    },
    1: {
      date: weekstart.plus({days: 1}),
      events: []
    },
    2: {
      date: weekstart.plus({days: 2}),
      events: []
    },
    3: {
      date: weekstart.plus({days: 3}),
      events: []
    },
    4: {
      date: weekstart.plus({days: 4}),
      events: []
    },
    5: {
      date: weekstart.plus({days: 5}),
      events: []
    },
    6: {
      date: weekstart.plus({days: 6}),
      events: []
    },
  }

  /**
  * [ **placeRecurrenceInWeek** ]
  * - Places recurring events into the weekEvents array
  * @param {DateTime} event - The recurring event we are trying to place in the current week
  */
  const placeRecurrenceInWeek = (event) => {
    // If the recurrance has a definite end, and it has expired, return
    if(!!event.rrule.options.until && weekend.toMillis() > DateTime.fromISO(event.rrule.options.until.toISOString()).toMillis()) return
    // Otherwise, add the times in the current week
    // Need the start and end times (for hour and minute)
    const start = DateTime.fromISO(event.start.toISOString())
    const end = DateTime.fromISO(event.end.toISOString())
    // loop through the weekdays of the recurrance, adding events in the week
    for(const weekday of event.rrule.options.byweekday) {
      const weekdayNum = Number(weekday) + 8 // byweekday has Monday=0, luxon has Monday=1, and have to compensate for Sunday=7
      // construct our event object
      const currentEvent = {
        summary: event.summary,
        start: weekstart.set({ hour: start.hour, minute: start.minute, second: start.second, weekday: weekdayNum }),
        end: weekstart.set({ hour: end.hour, minute: end.minute, second: end.second, weekday: weekdayNum }),
        event
      }
      // add it to the weekEvents if it falls in the week
      if(weekInterval.contains(currentEvent.start)) weekEvents[`${currentEvent.start.weekday % 7}`].events.push(currentEvent)
    }
  }
  
  /**
  * [ **placeEvents** ]
  * - adds all events into `weekEvents` that occur in `weekInterval` from ics file
  */
  const placeEvents = (calendars) => {
    // Loops over all events from ics file
    for(const events of calendars) {
      for (const event of Object.values(events)) {
        // if the event is an event...
        if(event.type === 'VEVENT') {
          // note the start and end times
          const start = DateTime.fromISO(event.start.toISOString())
          const end = DateTime.fromISO(event.end.toISOString())
          // if it is a recurring event, place the recurrences in the current week
          if(event.rrule) {
            placeRecurrenceInWeek(event)
          } 
          else if (weekInterval.contains(start)) { // otherwise, place if in current week
            weekEvents[ `${start.weekday % 7}` ].events.push({
              summary: event.summary,
              start,
              end,
              event
            })
          }
        }
      }
    }
    for(const key of Object.keys(weekEvents)) {
      weekEvents[key].events = weekEvents[key].events.sort((a, b) => a.start - b.start)
    }
  }

  /**
  * [ **printKeyDateTimes** ]
  * - little helper to print current time and week start/end
  */
  const printKeyDatetimes = () => {
    // console.log("from:", from.toLocaleString(DateTime.DATETIME_HUGE))
    // console.log("Week Start:", weekstart.toLocaleString(DateTime.DATETIME_HUGE))
    // console.log("Week End:", weekend.toLocaleString(DateTime.DATETIME_HUGE))
    return {
      from: from.toLocaleString(DateTime.DATETIME_HUGE),
      start: weekstart.toLocaleString(DateTime.DATETIME_HUGE), 
      end: weekend.toLocaleString(DateTime.DATETIME_HUGE),
    }
  }

  /**
  * [ **printEvents** ]
  * - little helper to print week events
  */
  const printEvents = () => {
    // console.log('\nYour Week:\n')
    // for(const key of Object.keys(weekEvents)) {
    //   console.log("KEY IS:", key)
    //   for(const event of weekEvents[key].events) {
    //     console.log(`${event.start.weekdayShort}:\t\t${event.summary}\n- Start:\t${event.start.toLocaleString(DateTime.DATETIME_MED)}\n- End:\t\t${event.end.toLocaleString(DateTime.DATETIME_MED)}\n`);
    //   }
    // }
    return "oops"
  }

  // make sure the events are populated!!
  return Promise.all(paths.map(async (a) =>
   a.mode === 'path' ? ical.sync.parseFile(a.path) 
    : ical.async.fromURL(a.path)))
  .then((completed) => placeEvents(completed))
  .then(() => ({
    from,
    weekstart,
    weekend,
    weekInterval,
    weekEvents,
    printKeyDatetimes,
    printEvents,
  }));
}

module.exports = week;