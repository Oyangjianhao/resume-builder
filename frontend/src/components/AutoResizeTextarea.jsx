/**
 * 自动撑高的 textarea — 内容多长就显示多长，不再截断
 * 用于简历预览页的所有可编辑文本区域
 */
import { useRef, useEffect } from 'react'

export default function AutoResizeTextarea({
  value,
  onChange,
  rows = 1,
  className = '',
  placeholder = '',
}) {
  const ref = useRef(null)

  // value 变化时自动调整高度（包括首次渲染）
  useEffect(() => {
    const el = ref.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={className}
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  )
}
