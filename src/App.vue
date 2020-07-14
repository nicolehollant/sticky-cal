<template>
  <div id="app" :class="theme" :key="theme">
    <router-view/>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { DateTime } from 'luxon'
export default {
  data() {
    return {
      theme: 'dark',
      now: DateTime.local()
    }
  },
  methods: {
    toggleTheme() {
      if (this.theme === 'dark') {
        this.theme = 'light'
      } else {
        this.theme = 'dark'
      }
    }
  },
  mounted () {
    ipcRenderer.send('checkCurrentTheme')
    ipcRenderer.on('themeUpdated', () => {
      ipcRenderer.send('checkCurrentTheme')
    })
    ipcRenderer.on('currentTheme', (event, theme) => {
      this.theme = theme
      document.getElementsByTagName('html')[0].style.backgroundColor = theme === 'dark' ? 'rgb(44,  44,  46)' : 'rgb(229, 229, 234)';
    });
  },
}
</script>

<style lang="postcss">
.dark, .light {
  transition-property: background-color, color !important;
  @apply ease-slow;
}
.light {
  --system-text: rgb(28,  28,  30);
  --system-gray-1: rgb(142, 142, 147);
  --system-gray-2: rgb(174, 174, 178);
  --system-gray-3: rgb(199, 199, 204);
  --system-gray-4: rgb(209, 209, 214);
  --system-gray-5: rgb(229, 229, 234);
  --system-gray-6: rgb(242, 242, 247);
  --system-blue: rgb(0, 122, 255);
  --system-green: rgb(52, 199, 89);
  --system-indigo: rgb(88, 86, 214);
  --system-orange: rgb(255, 149, 0);
  --system-pink: rgb(255, 45, 85);
  --system-purple: rgb(175, 82, 222);
  --system-red: rgb(255, 59, 48);
  --system-teal: rgb(90, 200, 250);
  --system-yellow: rgb(255, 204, 0);
}
.dark {
  --system-text: rgb(242, 242, 247);
  --system-gray-1: rgb(142, 142, 147);
  --system-gray-2: rgb(99,  99,  102);
  --system-gray-3: rgb(72,  72,  74);
  --system-gray-4: rgb(58,  58,  60);
  --system-gray-5: rgb(44,  44,  46);
  --system-gray-6: rgb(28,  28,  30);
  --system-blue: rgb(10, 132, 255);
  --system-green: rgb(48, 209, 88);
  --system-indigo: rgb(94, 92, 230);
  --system-orange: rgb(255, 159, 10);
  --system-pink: rgb(255, 55, 95);
  --system-purple: rgb(191, 90, 242);
  --system-red: rgb(255, 69, 58);
  --system-teal: rgb(100, 210, 255);
  --system-yellow: rgb(255, 214, 10);
}
#app {
  font-family: "SF Pro Text", "SF Pro Icons", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  min-height: 100vh;
  @apply bg-sys-5
}
</style>
