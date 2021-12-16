import Vue from 'vue'
import Vuetify from "vuetify"
import mixin from '@/mixin'

Vue.use(Vuetify)
Vue.mixin(mixin)

const app = '<div id="app" data-app="true"><div></div></div>'
document.body.innerHTML += app