/**
 * 商务编辑器 — 左侧深色侧栏 + 右侧白色主体
 * 侧栏和主体是两个独立的拖拽区域
 */
import { useState } from 'react'
import useEditorStore from '../store/editorStore'
import AutoResizeTextarea from '../components/AutoResizeTextarea'
import PhotoUpload from '../components/PhotoUpload'

// ===== 侧栏 Header =====
function SidebarHeader({ section }) {
  const store = useEditorStore()
  const update = (key, val) => store.updateHeaderField(key, val)

  return (
    <div className="mb-6">
      <PhotoUpload photo={store.photo} setPhoto={store.setPhoto} className="w-24 h-32 mb-4" />
      <input
        value={section.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder="你的姓名"
        className="text-2xl font-bold text-white w-full bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-400 outline-none mb-1"
      />
      <input
        value={section.target_position}
        onChange={(e) => update('target_position', e.target.value)}
        placeholder="求职意向"
        className="text-blue-300 text-sm w-full bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-400 outline-none"
      />
    </div>
  )
}

// ===== 主体 Header（仅显示姓名和联系方式一行） =====
function MainHeader({ section }) {
  const store = useEditorStore()
  const update = (key, val) => store.updateHeaderField(key, val)

  return (
    <div className="mb-4 pb-3 border-b-2 border-gray-800">
      <input
        value={section.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder="你的姓名"
        className="text-3xl font-bold text-gray-900 w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none"
      />
      <div className="flex gap-3 text-sm text-gray-500 mt-2">
        <input value={section.phone} onChange={(e) => update('phone', e.target.value)}
          placeholder="手机号"
          className="bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none w-32" />
        <span className="text-gray-300">|</span>
        <input value={section.email} onChange={(e) => update('email', e.target.value)}
          placeholder="邮箱"
          className="bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none w-48" />
      </div>
    </div>
  )
}

// ===== 侧栏板块（深色背景样式） =====
function SidebarSection({ section }) {
  const store = useEditorStore()

  if (section.type === 'header') {
    return <SidebarHeader section={section} />
  }

  // List 类型（侧栏最常见：技能、证书、联系方式）
  if (section.type === 'list') {
    return (
      <div className="mb-6">
        <input
          value={section.title}
          onChange={(e) => store.updateSectionTitle(section.id, e.target.value)}
          className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pb-1 border-b w-full bg-transparent border-gray-600 focus:border-blue-400 outline-none"
        />
        {(section.items || []).map((item, i) => (
          <div key={i} className="flex items-start gap-1 group/item mb-1">
            <AutoResizeTextarea
              value={item}
              onChange={(e) => store.updateListItem(section.id, i, e.target.value)}
              placeholder="输入内容..."
              rows={1}
              className="text-gray-300 text-xs bg-transparent outline-none flex-1 leading-relaxed"
            />
            <button
              onClick={() => store.removeListItem(section.id, i)}
              className="text-red-400 text-xs opacity-0 group-hover/item:opacity-100 shrink-0 edit-control"
            >x</button>
          </div>
        ))}
        <button
          onClick={() => store.addListItem(section.id)}
          className="text-gray-500 text-xs mt-1 hover:text-gray-300 edit-control"
        >+ 添加</button>
      </div>
    )
  }

  // Entries 类型（侧栏中的教育经历等，简化展示）
  if (section.type === 'entries') {
    return (
      <div className="mb-6">
        <input
          value={section.title}
          onChange={(e) => store.updateSectionTitle(section.id, e.target.value)}
          className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pb-1 border-b w-full bg-transparent border-gray-600 focus:border-blue-400 outline-none"
        />
        {(section.entries || []).map((entry) => (
          <div key={entry.id} className="mb-3 group/entry relative">
            <button
              onClick={() => store.removeEntry(section.id, entry.id)}
              className="absolute right-0 top-0 text-red-400 text-xs opacity-0 group-hover/entry:opacity-100 edit-control"
            >删</button>
            <input
              value={entry.main}
              onChange={(e) => store.updateEntry(section.id, entry.id, 'main', e.target.value)}
              placeholder="学校/公司"
              className="text-white text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-400 outline-none w-full"
            />
            <input
              value={entry.sub}
              onChange={(e) => store.updateEntry(section.id, entry.id, 'sub', e.target.value)}
              placeholder="专业/职位"
              className="text-gray-400 text-xs bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-400 outline-none w-full"
            />
            <input
              value={entry.dates}
              onChange={(e) => store.updateEntry(section.id, entry.id, 'dates', e.target.value)}
              placeholder="2023 - 2027"
              className="text-gray-500 text-xs bg-transparent outline-none w-full"
            />
            {(entry.bullets || []).map((bullet, j) => (
              <div key={j} className="flex items-start gap-1 group/bullet mt-1">
                <AutoResizeTextarea
                  value={bullet}
                  onChange={(e) => store.updateBullet(section.id, entry.id, j, e.target.value)}
                  placeholder="描述..."
                  rows={1}
                  className="text-gray-300 text-xs bg-transparent outline-none flex-1 leading-relaxed"
                />
                <button
                  onClick={() => store.removeBullet(section.id, entry.id, j)}
                  className="text-red-400 text-xs opacity-0 group-hover/bullet:opacity-100 shrink-0 edit-control"
                >x</button>
              </div>
            ))}
            <button
              onClick={() => store.addBullet(section.id, entry.id)}
              className="text-gray-500 text-xs mt-1 hover:text-gray-300 edit-control"
            >+ 要点</button>
          </div>
        ))}
        <button
          onClick={() => store.addEntry(section.id)}
          className="text-gray-500 text-xs hover:text-gray-300 edit-control"
        >+ 添加</button>
      </div>
    )
  }

  // Paragraph 类型（侧栏中较少见）
  if (section.type === 'paragraph') {
    return (
      <div className="mb-6">
        <input
          value={section.title}
          onChange={(e) => store.updateSectionTitle(section.id, e.target.value)}
          className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pb-1 border-b w-full bg-transparent border-gray-600 focus:border-blue-400 outline-none"
        />
        <AutoResizeTextarea
          value={section.content}
          onChange={(e) => store.updateParagraph(section.id, e.target.value)}
          placeholder="输入内容..."
          rows={3}
          className="text-gray-300 text-xs leading-relaxed w-full bg-transparent outline-none"
        />
      </div>
    )
  }

  return null
}

// ===== 主体板块（白色背景样式） =====
function MainSection({ section }) {
  const store = useEditorStore()

  // Paragraph
  if (section.type === 'paragraph') {
    return (
      <div className="mb-6">
        <input
          value={section.title}
          onChange={(e) => store.updateSectionTitle(section.id, e.target.value)}
          className="text-base font-bold text-gray-800 mb-2 pb-1 border-b-2 w-full bg-transparent border-gray-800 focus:border-blue-400 outline-none"
        />
        <AutoResizeTextarea
          value={section.content}
          onChange={(e) => store.updateParagraph(section.id, e.target.value)}
          placeholder="在这里写一段总结..."
          rows={3}
          className="text-gray-600 text-sm leading-relaxed w-full bg-transparent outline-none"
        />
      </div>
    )
  }

  // Entries
  if (section.type === 'entries') {
    return (
      <div className="mb-6">
        <input
          value={section.title}
          onChange={(e) => store.updateSectionTitle(section.id, e.target.value)}
          className="text-base font-bold text-gray-800 mb-3 pb-1 border-b-2 w-full bg-transparent border-gray-800 focus:border-blue-400 outline-none"
        />
        {(section.entries || []).map((entry) => (
          <div key={entry.id} className="mb-4 group/entry relative">
            <button
              onClick={() => store.removeEntry(section.id, entry.id)}
              className="absolute right-0 top-0 text-red-300 text-xs opacity-0 group-hover/entry:opacity-100 edit-control"
            >删除</button>
            <div className="flex justify-between items-baseline gap-2">
              <div className="flex items-baseline gap-2">
                <input
                  value={entry.main}
                  onChange={(e) => store.updateEntry(section.id, entry.id, 'main', e.target.value)}
                  placeholder="公司/项目名称"
                  className="font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none"
                />
                <span className="text-gray-400">|</span>
                <input
                  value={entry.sub}
                  onChange={(e) => store.updateEntry(section.id, entry.id, 'sub', e.target.value)}
                  placeholder="职位/角色"
                  className="text-gray-500 text-sm bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none"
                />
              </div>
              <input
                value={entry.dates}
                onChange={(e) => store.updateEntry(section.id, entry.id, 'dates', e.target.value)}
                placeholder="2025.7 - 2025.9"
                className="text-gray-400 text-xs bg-transparent outline-none w-32 text-right"
              />
            </div>
            {(entry.bullets || []).map((bullet, j) => (
              <div key={j} className="flex items-start gap-1 group/bullet mt-1">
                <span className="text-gray-300 text-xs mt-1 shrink-0">&bull;</span>
                <AutoResizeTextarea
                  value={bullet}
                  onChange={(e) => store.updateBullet(section.id, entry.id, j, e.target.value)}
                  placeholder="描述..."
                  rows={1}
                  className="text-gray-600 text-sm bg-transparent outline-none flex-1 resize-none"
                />
                <button
                  onClick={() => store.removeBullet(section.id, entry.id, j)}
                  className="text-red-300 text-xs opacity-0 group-hover/bullet:opacity-100 shrink-0 edit-control"
                >x</button>
              </div>
            ))}
            <button
              onClick={() => store.addBullet(section.id, entry.id)}
              className="text-blue-400 text-xs mt-1 hover:text-blue-600 edit-control"
            >+ 添加要点</button>
          </div>
        ))}
        <button
          onClick={() => store.addEntry(section.id)}
          className="text-blue-400 text-xs hover:text-blue-600 edit-control"
        >+ 添加一段经历</button>
      </div>
    )
  }

  // List
  if (section.type === 'list') {
    return (
      <div className="mb-6">
        <input
          value={section.title}
          onChange={(e) => store.updateSectionTitle(section.id, e.target.value)}
          className="text-base font-bold text-gray-800 mb-2 pb-1 border-b-2 w-full bg-transparent border-gray-800 focus:border-blue-400 outline-none"
        />
        {(section.items || []).map((item, i) => (
          <div key={i} className="flex items-start gap-1 group/item">
            <span className="text-gray-400 text-sm mt-1.5 shrink-0">&bull;</span>
            <AutoResizeTextarea
              value={item}
              onChange={(e) => store.updateListItem(section.id, i, e.target.value)}
              placeholder="输入内容..."
              rows={1}
              className="text-gray-600 text-sm bg-transparent outline-none flex-1"
            />
            <button
              onClick={() => store.removeListItem(section.id, i)}
              className="text-red-300 text-xs opacity-0 group-hover/item:opacity-100 shrink-0 edit-control"
            >x</button>
          </div>
        ))}
        <button
          onClick={() => store.addListItem(section.id)}
          className="text-blue-400 text-xs mt-1 hover:text-blue-600 edit-control"
        >+ 添加</button>
      </div>
    )
  }

  return null
}

// ===== 板块外框 =====
function DraggableWrapper({ section, children, onDragStart, onDragOver, onDrop }) {
  const store = useEditorStore()
  const isHeader = section.type === 'header'

  return (
    <div
      draggable={!isHeader}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="group relative"
    >
      {!isHeader && (
        <div className="absolute left-[-20px] top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <span className="cursor-grab text-gray-400 text-sm select-none">⠿</span>
          <button
            onClick={() => store.removeSection(section.id)}
            className="text-red-400 text-xs hover:text-red-600 edit-control"
          >✕</button>
        </div>
      )}
      {children}
    </div>
  )
}

// ===== 主组件 =====
export default function BusinessEditor() {
  const store = useEditorStore()
  const [dragId, setDragId] = useState(null)

  const sidebarSections = store.sections.filter(s => s.sidebar)
  const mainSections = store.sections.filter(s => !s.sidebar)

  // 主体区域需要找header来渲染简版头部
  const mainHeader = store.sections.find(s => s.type === 'header')

  function handleDragStart(id) {
    return (e) => {
      setDragId(id)
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(targetId) {
    return () => {
      if (dragId && dragId !== targetId) {
        store.reorderSections(dragId, targetId)
      }
      setDragId(null)
    }
  }

  return (
    <div className="bg-white shadow-lg flex min-h-[800px]" id="resume-preview">
      {/* 左侧侧栏 */}
      <div className="w-1/3 bg-gray-800 text-white p-8">
        {sidebarSections.map((section) => (
          <DraggableWrapper
            key={section.id}
            section={section}
            onDragStart={handleDragStart(section.id)}
            onDragOver={handleDragOver}
            onDrop={handleDrop(section.id)}
          >
            <SidebarSection section={section} />
          </DraggableWrapper>
        ))}
      </div>

      {/* 右侧主体 */}
      <div className="w-2/3 p-8">
        {/* 主体头部：显示姓名+联系方式 */}
        {mainHeader && <MainHeader section={mainHeader} />}

        {mainSections.filter(s => s.type !== 'header').map((section) => (
          <DraggableWrapper
            key={section.id}
            section={section}
            onDragStart={handleDragStart(section.id)}
            onDragOver={handleDragOver}
            onDrop={handleDrop(section.id)}
          >
            <MainSection section={section} />
          </DraggableWrapper>
        ))}
      </div>
    </div>
  )
}
