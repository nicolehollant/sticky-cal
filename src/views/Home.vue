<template>
<div class="stickycal">
  <Header 
    :currentWeek="currentWeek"
    :calendars="calendars"
    @updateData="updateData"
    @removeCal="removeCal"
    @handleFiles="handleFiles"
    @previousWeek="previousWeek"
    @today="today"
    @nextWeek="nextWeek"
    @updateCurrentCals="updateCurrentCals"
  />
  <div class="week" v-if="!!currentWeek">
    <div class="weekday" v-for="(weekEvents, index) in currentWeek.weekEvents" :key="localeStr(weekEvents.date)">
      <div class="weekday__calendar">
        <div class="weekday__date">
          {{ weekday(weekEvents.date)[0] }} 
          <span :class="{ 'weekday__date--current': now.day === weekEvents.date.day && now.month === weekEvents.date.month && now.year === weekEvents.date.year}">
            {{ weekday(weekEvents.date)[1] }}
          </span>
        </div>
        <div class="weekday__event--wrapper">
          <div class="weekday__event" v-for="event in weekEvents.events" :key="localeStr(event.start)">
            <div class="event__time">{{ timeSimpleFirst(event.start) }} <span class="text-pink-400">-</span> {{ timeSimple(event.end) }}</div>
            <div class="event__summary">{{ event.summary }}</div>
            <div class="event__location">{{ event.event.location }}</div>
          </div>
        </div>
      </div>
      <div class="separator"></div>
      <div class="weekday__note--wrapper" v-if="notes" >
        <Editable v-model="notes.week[index]" class="weekday__note" />
      </div>
    </div>
  </div>
  <div class="footer" v-if="notes">
    <div class="footer__head">General Notes</div>
    <Editable v-model="notes.general" class="general-note" />
  </div>
</div>
</template>

<script>
import fs from 'fs'
import { ipcRenderer } from 'electron'
import _ from 'lodash'
import week from '@/assets/js/week'
import { DateTime } from 'luxon'
import Editable from '@/components/Editable.vue'
import Header from '@/components/Header.vue'
export default {
  name: 'home',
  components: {
    Editable,
    Header
  },
  data() {
    return {
      now: DateTime.local(),
      calendars: null,
      currentWeek: null,
      notes: null,
      datapath: null,
      allNotes: null,
      addFileMenuOpen: false,
      calendarsMenuOpen: false,
      fileUrl: ''
    }
  },
  computed: {
    enabledCalendars() {
      return this.calendars ? this.calendars.filter(a => a.enabled) : null
    },
    weekSpan() {
      if (this.currentWeek.weekstart.monthShort === this.currentWeek.weekend.monthShort) {
        return `${this.currentWeek.weekstart.monthShort} ${this.currentWeek.weekstart.day} - ${this.currentWeek.weekend.day}`
      }
      return `${this.currentWeek.weekstart.monthShort} ${this.currentWeek.weekstart.day} - ${this.currentWeek.weekend.monthShort} ${this.currentWeek.weekend.day}`
    }
  },
  methods: {
    removeCal(index) {
      this.calendars.splice(index, 1)
      this.updateData()
      week(this.enabledCalendars || []).then(a => this.currentWeek = a)
    },
    handleFiles(e) {
      for(const file of e.target.files) {
        if(!this.calendars.find(a => a.path === file.path)) {
          this.calendars.push({mode: 'path', path: file.path, enabled: true })
        }
      }
      this.updateData()
      week(this.enabledCalendars || []).then(a => this.currentWeek = a)
    },
    updateCurrentCals() {
      _.debounce(() => week(this.enabledCalendars, this.currentWeek.from).then(a => {
        this.currentWeek = a
        this.notes = this.allNotes[this.currentWeek.weekstart.toLocaleString(DateTime.DATETIME_SHORT)] || this.makeWeek()
        this.updateData()
      }), 1000)()
    },
    today() {
      week(this.enabledCalendars, DateTime.local()).then(a => {
        this.currentWeek = a
        this.notes = this.allNotes[this.currentWeek.weekstart.toLocaleString(DateTime.DATETIME_SHORT)] || this.makeWeek()
      })
    },
    previousWeek() {
      week(this.enabledCalendars, this.currentWeek.from.minus({ weeks: 1 })).then(a => {
        this.currentWeek = a
        this.notes = this.allNotes[this.currentWeek.weekstart.toLocaleString(DateTime.DATETIME_SHORT)] || this.makeWeek()
      })
    },
    nextWeek() {
      week(this.enabledCalendars, this.currentWeek.from.plus({ weeks: 1 })).then(a => {
        this.currentWeek = a
        this.notes = this.allNotes[this.currentWeek.weekstart.toLocaleString(DateTime.DATETIME_SHORT)] || this.makeWeek()
      })
    },
    weekday(event) {
      return [event.weekdayShort, event.day]
    },
    timeSimpleFirst(event) {
      return event.toLocaleString(DateTime.TIME_SIMPLE).replace(/:00/g, '').replace(/AM/g, '').replace(/PM/g, '').trim()
    },
    timeSimple(event) {
      return event.toLocaleString(DateTime.TIME_SIMPLE).replace(/:00/g, '')
    },
    localeStr(event) {
      return event.toLocaleString(DateTime.DATETIME_MED)
    },
    sortedEvents(events) {
      return events.sort((a, b) => a.start - b.start)
    },
    updateData(newCal=null, cb=null) {
      if(newCal !== null) {
        if ('mode' in newCal && 'path' in newCal && 'mode' in newCal) {
          this.calendars.push(newCal)
        }
      }
      if(cb) cb()
      this.allNotes[this.currentWeek.weekstart.toLocaleString(DateTime.DATETIME_SHORT)] = { week: this.notes.week, general: this.notes.general }
      const cals = []
      for(const calendar of this.calendars) {
        if ('mode' in calendar && 'path' in calendar && 'mode' in calendar) {
          cals.push(calendar)
        }
      }
      this.allNotes.calendars = cals
      fs.writeFileSync(this.datapath, JSON.stringify(this.allNotes))
    },
    makeWeek() {
      return {
        "week": ["","","","","","",""],
        "general": ""
      }
    }
  },
  mounted () {
    week(this.enabledCalendars || []).then(a => this.currentWeek = a)
    ipcRenderer.send('checkDataPath')
    ipcRenderer.on('datapath', (event, datapath) => {
      this.datapath = datapath
      console.log(datapath)
      const dataContents = fs.readFileSync(datapath)
      // check to make sure that there is content in here, if its empty init with empty obj
      const notes = JSON.parse(dataContents.length === 0 ? '{}' : dataContents)
      this.allNotes = notes
      // if theres a key for the current week:
      if (this.currentWeek.weekstart.toLocaleString(DateTime.DATETIME_SHORT) in notes) {
        this.notes = notes[this.currentWeek.weekstart.toLocaleString(DateTime.DATETIME_SHORT)]
      } else {
        notes[this.currentWeek.weekstart.toLocaleString(DateTime.DATETIME_SHORT)] = this.makeWeek()
        this.notes = notes[this.currentWeek.weekstart.toLocaleString(DateTime.DATETIME_SHORT)]
      }
      if ('calendars' in notes) {
        this.calendars = notes.calendars
      } else {
        this.calendars = []
      }
      week(this.enabledCalendars || []).then(a => this.currentWeek = a)
      document.addEventListener('keyup', _.debounce(this.updateData, 1500))
    });
  },
}
</script>

<style lang="postcss">
.stickycal {
  @apply h-screen overflow-auto
}
.week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.weekday {
  @apply relative mt-10 flex-col bg-sys-6 font-medium text-left border-r border-b border-t border-sys-4
}
.weekday__calendar {
  @apply p-2
}
.weekday:first-of-type {
  border-left: none;
}
.weekday:last-of-type {
  border-right: none;
}
.weekday__event {
  @apply my-2 h-24 overflow-scroll
}
.weekday__event--wrapper {
  height: 14rem;
  overflow: scroll;
}
.weekday__date {
  position: absolute;
  top: -1.675rem;
  width: max-content;
  @apply font-normal text-sys-text h-12 text-sm
}
.weekday__date--current {
  line-height: 1;
  @apply font-bold bg-sys-red inline-flex items-center justify-center w-6 h-6 rounded-full text-sys-6
}
.event__summary {
  @apply font-semibold text-sm text-sys-pink
}
.event__time {
  @apply font-normal text-sm text-sys-purple break-all
}
.event__location {
  @apply font-normal text-xs text-sys-1
}
.separator {
  @apply h-px bg-sys-4
}
.weekday__note--wrapper {
  height: 14rem;
  overflow: scroll;
  width: 100%;
  position: relative;
  @apply bg-sys-6
}
.weekday__note {
  min-height: 100%;
  max-width: calc(100vw / 7);
  @apply w-full text-sys-text text-sm font-normal bg-transparent p-2
}
.dark .weekday__note, .dark .general-note {
  background-image: url('../assets/darkpaper.png');
}
.light .weekday__note, .light .general-note {
  background-image: url('../assets/lightpaper.png');
}
.weekday__note:focus {
  @apply outline-none
}
.footer {
  @apply relative w-full h-full
}
.footer__head {
  @apply absolute top-0 left-0 h-12 p-2 text-sys-1 text-xl font-semibold
}
.general-note {
  height: inherit;
  @apply w-full pt-12 px-2 pb-2 text-left text-sys-text;
}
.general-note:focus {
  @apply outline-none
}

.btn {
  @apply border
}
.btn:focus {
  @apply outline-none border-focus !important
}


@screen lg {
  .weekday {
    @apply bg-sys-6 border-sys-4
  }
  .weekday__date--current {
    @apply w-8 h-8
  }
  .weekday__calendar, .weekday__note {
    @apply p-4
  }
  .weekday__note--wrapper {
    min-height: 16rem;
    @apply rounded border-t-0
  }
  .weekday__date {
    top: -2.25rem;
    @apply text-lg
  }
  .event__summary {
    @apply text-base
  }
  .event__time {
    @apply text-base
  }
  .event__location {
    @apply text-sm
  }
  .footer__head {
    @apply px-4
  }
  .general-note {
    @apply px-4
  }
}
</style>