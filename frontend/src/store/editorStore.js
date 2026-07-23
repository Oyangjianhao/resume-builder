/**
 * 可视化编辑器状态管理（Zustand Store）
 * 用于 /editor 页面的 sections 数据模型
 * 与主 resumeStore 完全独立
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ===== 唯一 ID 生成 =====
let _id = 0
const uid = () => `s${Date.now()}_${++_id}`

// ===== 模板预设 =====
export const TEMPLATES = {
  minimal: {
    label: '简约',
    desc: '白底单栏，干净清晰',
    sections: [
      { id: uid(), type: 'header', title: '', sidebar: false, name: '', phone: '', email: '', target_position: '' },
      { id: uid(), type: 'paragraph', title: '个人总结', sidebar: false, content: '' },
      { id: uid(), type: 'entries', title: '教育经历', sidebar: false, entries: [
        { id: uid(), main: '', sub: '', dates: '', bullets: [''] }
      ]},
      { id: uid(), type: 'entries', title: '工作经历', sidebar: false, entries: [] },
      { id: uid(), type: 'entries', title: '项目经历', sidebar: false, entries: [
        { id: uid(), main: '', sub: '', dates: '', bullets: [''] }
      ]},
      { id: uid(), type: 'list', title: '专业技能', sidebar: false, items: [''] },
      { id: uid(), type: 'list', title: '证书', sidebar: false, items: [''] },
    ],
  },
  business: {
    label: '商务',
    desc: '深色侧栏 + 主体，更正式',
    sections: [
      { id: uid(), type: 'header', title: '', sidebar: true, name: '', phone: '', email: '', target_position: '' },
      { id: uid(), type: 'list', title: '联系方式', sidebar: true, items: ['电话 ', '邮箱 '] },
      { id: uid(), type: 'list', title: '专业技能', sidebar: true, items: [''] },
      { id: uid(), type: 'list', title: '证书', sidebar: true, items: [''] },
      { id: uid(), type: 'entries', title: '教育经历', sidebar: true, entries: [
        { id: uid(), main: '', sub: '', dates: '', bullets: [] }
      ]},
      { id: uid(), type: 'paragraph', title: '个人总结', sidebar: false, content: '' },
      { id: uid(), type: 'entries', title: '工作经历', sidebar: false, entries: [] },
      { id: uid(), type: 'entries', title: '项目经历', sidebar: false, entries: [
        { id: uid(), main: '', sub: '', dates: '', bullets: [''] }
      ]},
    ],
  },
}

function cloneTemplate(key) {
  return JSON.parse(JSON.stringify(TEMPLATES[key].sections)).map(s => ({
    ...s,
    id: uid(),
    entries: s.entries?.map(e => ({ ...e, id: uid() })),
  }))
}

// ===== Store =====
const useEditorStore = create(
  persist(
    (set, get) => ({

  template: 'minimal',
  sections: cloneTemplate('minimal'),
  photo: null,

  setTemplate: (key) => set({
    template: key,
    sections: cloneTemplate(key),
    photo: null,
  }),

  setPhoto: (dataUrl) => set({ photo: dataUrl }),

  // ===== 板块操作 =====
  updateSectionTitle: (id, title) => set((state) => ({
    sections: state.sections.map(s => s.id === id ? { ...s, title } : s)
  })),

  addSection: (type, sidebar = false) => set((state) => {
    const defaults = {
      paragraph: { id: uid(), type: 'paragraph', title: '新板块', sidebar, content: '' },
      list: { id: uid(), type: 'list', title: '新板块', sidebar, items: [''] },
      entries: { id: uid(), type: 'entries', title: '新板块', sidebar, entries: [
        { id: uid(), main: '', sub: '', dates: '', bullets: [''] }
      ]},
    }
    const newSection = defaults[type]
    if (!newSection) return state

    const lastSameSideIndex = state.sections.findLastIndex(s => s.sidebar === sidebar)
    const newSections = [...state.sections]
    if (lastSameSideIndex >= 0) {
      newSections.splice(lastSameSideIndex + 1, 0, newSection)
    } else {
      newSections.push(newSection)
    }
    return { sections: newSections }
  }),

  removeSection: (id) => set((state) => ({
    sections: state.sections.filter(s => s.id !== id)
  })),

  reorderSections: (dragId, targetId) => set((state) => {
    const sections = [...state.sections]
    const dragIndex = sections.findIndex(s => s.id === dragId)
    const targetIndex = sections.findIndex(s => s.id === targetId)
    if (dragIndex < 0 || targetIndex < 0) return state
    if (sections[dragIndex].sidebar !== sections[targetIndex].sidebar) return state

    const [removed] = sections.splice(dragIndex, 1)
    sections.splice(targetIndex, 0, removed)
    return { sections }
  }),

  // ===== Header 字段 =====
  updateHeaderField: (key, value) => set((state) => ({
    sections: state.sections.map(s =>
      s.type === 'header' ? { ...s, [key]: value } : s
    )
  })),

  // ===== Paragraph =====
  updateParagraph: (id, content) => set((state) => ({
    sections: state.sections.map(s => s.id === id ? { ...s, content } : s)
  })),

  // ===== List items =====
  addListItem: (sectionId, text = '') => set((state) => ({
    sections: state.sections.map(s =>
      s.id === sectionId ? { ...s, items: [...(s.items || []), text] } : s
    )
  })),

  updateListItem: (sectionId, index, text) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === sectionId ? { ...s, items: s.items.map((item, i) => i === index ? text : item) } : s
    )
  })),

  removeListItem: (sectionId, index) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === sectionId ? { ...s, items: s.items.filter((_, i) => i !== index) } : s
    )
  })),

  // ===== Entries =====
  addEntry: (sectionId) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === sectionId ? {
        ...s,
        entries: [...(s.entries || []), { id: uid(), main: '', sub: '', dates: '', bullets: [''] }]
      } : s
    )
  })),

  updateEntry: (sectionId, entryId, field, value) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === sectionId ? {
        ...s,
        entries: s.entries.map(e => e.id === entryId ? { ...e, [field]: value } : e)
      } : s
    )
  })),

  removeEntry: (sectionId, entryId) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === sectionId ? { ...s, entries: s.entries.filter(e => e.id !== entryId) } : s
    )
  })),

  addBullet: (sectionId, entryId) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === sectionId ? {
        ...s,
        entries: s.entries.map(e => e.id === entryId ? { ...e, bullets: [...e.bullets, ''] } : e)
      } : s
    )
  })),

  updateBullet: (sectionId, entryId, bulletIndex, text) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === sectionId ? {
        ...s,
        entries: s.entries.map(e => e.id === entryId ? {
          ...e,
          bullets: e.bullets.map((b, i) => i === bulletIndex ? text : b)
        } : e)
      } : s
    )
  })),

  removeBullet: (sectionId, entryId, bulletIndex) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === sectionId ? {
        ...s,
        entries: s.entries.map(e => e.id === entryId ? {
          ...e,
          bullets: e.bullets.filter((_, i) => i !== bulletIndex)
        } : e)
      } : s
    )
  })),

}),
    { name: 'editor-storage' }
  )
)

export default useEditorStore
