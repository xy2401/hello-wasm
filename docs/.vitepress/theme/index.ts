import DefaultTheme from 'vitepress/theme'
import LanguageContainerWorkbench from './components/LanguageContainerWorkbench.vue'
import './doc-baseline.css'
import './browser-workbench.css'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LanguageContainerWorkbench', LanguageContainerWorkbench)
  },
}
