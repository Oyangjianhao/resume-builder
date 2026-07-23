/**
 * 简约编辑器 — 白底单栏，所有板块纵向排列
 * 每个板块可拖拽排序、可编辑标题和内容、可删除
 */
import { useState } from 'react'
import useEditorStore from '../store/editorStore'
import AutoResizeTextarea from '../components/AutoResizeTextarea'
import PhotoUpload from '../components/PhotoUpload'

// ===== 板块外框（拖拽 + hover控件） =====
function SectionWrapper({ section, children, onDragStart, onDragOver, onDrop }) {
  const store = useEditorStore()
  const isHeader = section.type === 'header'

  return (
    <div
      draggable={!isHeader}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="group relative mb-4"
    >
      {/* 拖拽手柄 + 删除按钮（hover显示，header除外） */}
      {!isHeader && (
        <div className="absolute left-[-28px] top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="cursor-grab text-gray-400 text-lg select-none" title="拖拽排序">⠿</span>
          <button
            onClick={() => store.removeSection(section.id)}
            className="text-red-400 text-xs hover:text-red-600"
            title="删除板块"
          >✕</button>
        </div>
      )}
      {children}
    </div>
  )
}

// ===== Header 板块 =====
function HeaderSection({ section }) {
  const store = useEditorStore()
  const update = (key, val) => store.updateHeaderField(key, val)

  return (
    <div className="text-center mb-6 pb-4 border-b">
      <input
        value={section.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder="你的姓名"
        className="text-3xl font-bold text-gray-900 text-center w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none mb-2"
      />
      <div className="flex justify-center gap-3 text-sm text-gray-500">
        <input value={section.phone} onChange={(e) => update('phone', e.target.value)}
          placeholder="手机号"
          className="bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none w-32 text-center" />
        <span className="text-gray-300">|</span>
        <input value={section.email} onChange={(e) => update('email', e.target.value)}
          placeholder="邮箱"
          className="bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none w-48 text-center" />
      </div>
      <input value={section.target_position} onChange={(e) => update('target_position', e.target.value)}
        placeholder="求职意向：如 Java后端开发"
        className="text-blue-600 font-medium mt-2 text-center bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none" />
      <div className="mt-4 flex justify-center">
        <PhotoUpload photo={store.photo} setPhoto={store.setPhoto} className="w-24 h-32" />
      </div>
    </div>
  )
}

// ===== Paragraph 板块 =====
function ParagraphSection({ section }) {
  const store = useEditorStore()
  return (
    <div className="mb-6">
      <input
        value={section.title}
        onChange={(e) => store.updateSectionTitle(section.id, e.target.value)}
        className="text-lg font-bold text-gray-800 mb-2 pb-1 border-b w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-400 outline-none"
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

// ===== List 板块 =====
function ListSection({ section }) {
  const store = useEditorStore()
  return (
    <div className="mb-6">
      <input
        value={section.title}
        onChange={(e) => store.updateSectionTitle(section.id, e.target.value)}
        className="text-lg font-bold text-gray-800 mb-2 pb-1 border-b w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-400 outline-none"
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
            className="text-red-300 text-xs opacity-0 group-hover/item:opacity-100 shrink-0 mt-1"
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

// ===== Entries 板块 =====
function EntriesSection({ section }) {
  const store = useEditorStore()
  return (
    <div className="mb-6">
      <input
        value={section.title}
        onChange={(e) => store.updateSectionTitle(section.id, e.target.value)}
        className="text-lg font-bold text-gray-800 mb-2 pb-1 border-b w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-400 outline-none"
      />
      {(section.entries || []).map((entry) => (
        <div key={entry.id} className="mb-4 group/entry relative">
          {/* 删除entry按钮 */}
          <button
            onClick={() => store.removeEntry(section.id, entry.id)}
            className="absolute right-0 top-0 text-red-300 text-xs opacity-0 group-hover/entry:opacity-100 edit-control"
          >删除</button>
          <div className="flex justify-between gap-2">
            <input
              value={entry.main}
              onChange={(e) => store.updateEntry(section.id, entry.id, 'main', e.target.value)}
              placeholder="公司/项目名称"
              className="font-medium text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none flex-1"
            />
            <input
              value={entry.dates}
              onChange={(e) => store.updateEntry(section.id, entry.id, 'dates', e.target.value)}
              placeholder="2025.7 - 2025.9"
              className="text-gray-400 text-sm bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none w-36 text-right"
            />
          </div>
          <input
            value={entry.sub}
            onChange={(e) => store.updateEntry(section.id, entry.id, 'sub', e.target.value)}
            placeholder="职位/专业"
            className="text-gray-500 text-sm bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none w-full mb-1"
          />
          {(entry.bullets || []).map((bullet, j) => (
            <div key={j} className="flex items-start gap-1 group/bullet">
              <span className="text-gray-400 text-sm mt-1.5 shrink-0">&bull;</span>
              <AutoResizeTextarea
                value={bullet}
                onChange={(e) => store.updateBullet(section.id, entry.id, j, e.target.value)}
                placeholder="描述..."
                rows={1}
                className="text-gray-600 text-sm bg-transparent outline-none flex-1"
              />
              <button
                onClick={() => store.removeBullet(section.id, entry.id, j)}
                className="text-red-300 text-xs opacity-0 group-hover/bullet:opacity-100 shrink-0 mt-1 edit-control"
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

// ===== 主组件 =====
export default function MinimalEditor() {
  const store = useEditorStore()
  const [dragId, setDragId] = useState(null)

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

  // 渲染单个板块
  function renderSection(section) {
    switch (section.type) {
      case 'header': return <HeaderSection section={section} />
      case 'paragraph': return <ParagraphSection section={section} />
      case 'list': return <ListSection section={section} />
      case 'entries': return <EntriesSection section={section} />
      default: return null
    }
  }

  return (
    <div className="bg-white shadow-lg p-10" id="resume-preview">
      {store.sections.map((section) => (
        <SectionWrapper
          key={section.id}
          section={section}
          onDragStart={handleDragStart(section.id)}
          onDragOver={handleDragOver}
          onDrop={handleDrop(section.id)}
        >
          {renderSection(section)}
        </SectionWrapper>
      ))}
    </div>
  )
}
