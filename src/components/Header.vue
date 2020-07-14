<template>
<header class="flex justify-between items-center px-2 py-3 leading-none lg:px-4">
  <div class="flex items-center">
    <div v-if="!!currentWeek" class="text-left text-3xl font-black text-sys-text mr-2">
      {{ currentWeek.from.monthLong }}
    </div>
    <div v-if="!!currentWeek" class="text-left text-3xl font-normal text-sys-text mr-4">
      {{ currentWeek.from.year }}
    </div>
    <div class="relative mr-2" v-click-outside="() => state.calendarsMenuOpen = false">
      <button @click="() => state.calendarsMenuOpen = !state.calendarsMenuOpen" class="text-xs text-sys-text font-medium px-2 py-1 mt-1 border-sys-3 bg-sys-3 rounded-sm flex items-center justify-center btn">
        Calendars
      </button>
      <div class="z-10 mt-1 p-4 absolute bg-sys-6 border-sys-2 rounded shadow-md border" v-if="state.calendarsMenuOpen">
        <!-- <p class="bg-green-300 text-black">{{calendars}}</p> -->
        <div v-for="(calendar, index) in calendars" :key="`cal-${index}-${calendar.path}`" class="flex items-center text-white my-2">
          <input type="checkbox" v-model="calendars[index].enabled" @click="$emit('updateCurrentCals')" class="mr-2 block">
          <div class="text-left text-sm w-40 truncate my-1 py-1" v-if="calendar.mode === 'path'">{{ calendar.path.split('/').slice(-1)[0] }}</div>
          <div class="text-left text-sm w-40 truncate my-1 py-1" v-else>{{ calendar.path.split('/').slice(-1)[0] }}</div>
          <button class="btn border-transparent" @click="$emit('removeCal', index)">
            <icon class="text-sm text-sys-orange cursor-pointer" icon="times" />
          </button>
        </div>
      </div>
    </div>
    <div class="relative" v-click-outside="() => state.addFileMenuOpen = false">
      <button @click="() => state.addFileMenuOpen = !state.addFileMenuOpen" class="text-xs text-sys-text font-medium px-2 py-1 mt-1 border-sys-3 bg-sys-3 rounded-sm flex items-center justify-center btn">
        <icon icon="plus" />
      </button>
      <div class="z-10 mt-1 p-4 absolute bg-sys-6 border-sys-2 rounded shadow-md border" v-if="state.addFileMenuOpen">

        <label for="url-input" class="url">
          <div class="text-sm text-sys-1 text-left font-medium mb-1">.ics url</div>
          <input id="url-input" class="bg-sys-5 p-1 text-sm text-sys-text rounded border-sys-5 ease-fast btn" type="text" v-model="state.fileUrl">
          <button class="w-max text-xs text-sys-text font-medium px-2 py-1 bg-sys-3 rounded-sm flex items-center justify-center mt-2 border-sys-3 ease-fast btn" @click="submitUrl">Submit</button>
        </label>

        <div class="separator relative my-6">
          <div
            class="absolute top-0 px-2 pb-1 leading-none text-sys-1 bg-sys-6"
            style="left: 50%; padding-top: 0.125rem; transform: translate(-50%, -50%);"
          >
            or
          </div>
        </div>

        <label for="file-upload-input">
          <input id="file-upload-input" class="hidden" type="file" multiple accept=".ics" @change="(e) => $emit('handleFiles', e)">
          <button class="w-max text-sm text-sys-text font-medium px-2 py-1 bg-sys-3 rounded-sm flex items-center justify-center m-px border-sys-3 ease-fast btn" @click="clickFileUpload">Upload File</button>
        </label>
      </div>
    </div>
  </div>
  <div class="flex">
    <button @click="$emit('previousWeek')" class="w-5 h-5 m-px text-xs flex items-center justify-center rounded-sm text-sys-text bg-sys-3 border-sys-3 btn">
      <icon icon="chevron-left" />
    </button>
    <button @click="$emit('today')" class="text-sm text-sys-text font-medium px-2 bg-sys-3 rounded-sm h-5 flex items-center justify-center m-px border-sys-3 btn">
      Today
    </button>
    <button @click="$emit('nextWeek')" class="w-5 h-5 m-px text-xs flex items-center justify-center rounded-sm text-sys-text bg-sys-3 border-sys-3 btn">
      <icon icon="chevron-right" />
    </button>
  </div>
</header>
</template>

<script>
import { defineComponent, reactive } from '@vue/composition-api'
const Header = defineComponent({
  props: {
    currentWeek: {
      type: null,
      default: () => ({})
    },
    calendars: {
      type: null,
      default: () => ({})
    },
  },
  setup(props, { emit }) {

    const state = reactive({
      calendarsMenuOpen: false,
      addFileMenuOpen: false,
      fileUrl: '',
    })
    
    function submitUrl() {
      if(!props.calendars.find(a => a.path === state.fileUrl) && state.fileUrl.startsWith('http')) {
        emit('updateData', {mode: 'url', path: state.fileUrl, enabled: true })
      }
    }
    
    function clickFileUpload() {
      document.getElementById('file-upload-input').click()
    }

    return {
      state,
      submitUrl,
      clickFileUpload
    }
  }
})
export default Header
</script>