/**
 * App 根组件 - 配置路由
 *
 * 类比：就像后端的 main.py 注册路由一样，
 * 这里把 URL 地址和对应的页面组件绑定起来。
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import FormPage from './pages/FormPage'
import PreviewPage from './pages/PreviewPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/preview" element={<PreviewPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
