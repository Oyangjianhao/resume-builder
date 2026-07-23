/**
 * 编辑器页面 — 可视化简历编辑器
 * 集成模板切换、板块管理（v0.2：导出功能已移除，编辑器搁置中）
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useEditorStore from '../store/editorStore'
import MinimalEditor from '../templates/MinimalEditor'
import BusinessEditor from '../templates/BusinessEditor'
// v0.2：导出功能已移除，编辑器页面搁置中

const EDITORS = {
  minimal: MinimalEditor,
  business: BusinessEditor,
}

export default function EditorPage() {
  const navigate = useNavigate()
  const store = useEditorStore()
  const [showAddMenu, setShowAddMenu] = useState(false)

  const EditorComponent = EDITORS[store.template] || MinimalEditor

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      {/* 顶部工具栏 */}
      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center px-4">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← 返回
        </button>

        <div className="flex gap-3 items-center">
          {/* 模板切换 */}
          <div className="flex border border-gray-200 rounded text-sm overflow-hidden">
            <button
              onClick={() => store.setTemplate('minimal')}
              className={`px-3 py-1.5 ${store.template === 'minimal' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              简约
            </button>
            <button
              onClick={() => store.setTemplate('business')}
              className={`px-3 py-1.5 ${store.template === 'business' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              商务
            </button>
          </div>

          {/* 添加板块 */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-300"
            >
              + 添加板块
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 w-40">
                <button onClick={() => { store.addSection('paragraph'); setShowAddMenu(false) }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                  段落文本
                </button>
                <button onClick={() => { store.addSection('list'); setShowAddMenu(false) }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                  列表板块
                </button>
                <button onClick={() => { store.addSection('entries'); setShowAddMenu(false) }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                  经历板块
                </button>
                {store.template === 'business' && (
                  <>
                    <hr className="my-1" />
                    <button onClick={() => { store.addSection('list', true); setShowAddMenu(false) }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                      侧栏 - 列表
                    </button>
                    <button onClick={() => { store.addSection('entries', true); setShowAddMenu(false) }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                      侧栏 - 经历
                    </button>
                    <button onClick={() => { store.addSection('paragraph', true); setShowAddMenu(false) }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                      侧栏 - 段落
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 提示 */}
      <div className="max-w-4xl mx-auto mb-3 px-4">
        <p className="text-xs text-gray-400 text-center">
          点击任意文字可直接编辑 · 拖拽 ⠿ 调整板块顺序 · hover 显示删除按钮
        </p>
      </div>

      {/* 编辑器主体 */}
      <div className="max-w-4xl mx-auto flex justify-center">
        <EditorComponent />
      </div>

      {/* 点击空白关闭添加菜单 */}
      {showAddMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
      )}
    </div>
  )
}
