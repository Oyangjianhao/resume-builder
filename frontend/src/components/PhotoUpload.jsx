/**
 * 简历照片上传组件
 * 点击上传证件照，再次点击可更换，hover 时显示操作提示
 */
import { useRef } from 'react'

export default function PhotoUpload({ photo, setPhoto, className = '' }) {
  const fileRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div
      onClick={() => fileRef.current?.click()}
      className={`shrink-0 cursor-pointer group relative ${className}`}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      {photo ? (
        <>
          <img
            src={photo}
            alt="证件照"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs">换照片</span>
          </div>
        </>
      ) : (
        <div className="w-full h-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400">
          <span className="text-xl leading-none">+</span>
          <span className="text-xs mt-0.5">照片</span>
        </div>
      )}
    </div>
  )
}
