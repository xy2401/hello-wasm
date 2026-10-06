import { installUiLabels } from './ui-labels'
import DefaultTheme from 'vitepress/theme'
import LanguageContainerWorkbench from './components/LanguageContainerWorkbench.vue'
import './doc-baseline.css'
import './browser-workbench.css'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    installUiLabels(app)
    app.component('LanguageContainerWorkbench', LanguageContainerWorkbench)
  },
}
