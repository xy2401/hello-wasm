import DefaultTheme from 'vitepress/theme'
import LanguageContainerWorkbench from './components/LanguageContainerWorkbench.vue'
import WasmRuntimePlayground from './components/WasmRuntimePlayground.vue'
import './doc-baseline.css'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LanguageContainerWorkbench', LanguageContainerWorkbench)
    app.component('WasmRuntimePlayground', WasmRuntimePlayground)
  },
}

