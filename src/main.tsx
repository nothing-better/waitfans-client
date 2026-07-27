import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { store } from './store'
import App from './App'
import './styles/globals.css'

const theme = {
  token: {
    colorPrimary: '#fb7299',
    borderRadius: 8,
    fontFamily:
      "'HarmonyOS Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
}

ConfigProvider.config({
  holderRender: (children) => (
    <ConfigProvider locale={zhCN} theme={theme}>
      {children}
    </ConfigProvider>
  ),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ConfigProvider locale={zhCN} theme={theme}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  </StrictMode>,
)
