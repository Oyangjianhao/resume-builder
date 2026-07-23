import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import GradientGlow from '../components/GradientGlow'

const PERSONAS = [
  {
    title: '应届生 / 实习生',
    desc: '没有工作经验？AI 帮你从课程项目、社团活动中挖掘亮点，把课堂作业变成专业经历。',
  },
  {
    title: '转行 / 跨岗',
    desc: '不相关的经历不等于没用。AI 提取可迁移能力，把服务业的执行力映射到目标岗位需要的素质。',
  },
  {
    title: '批量海投',
    desc: '不同公司看重不同的东西。粘贴不同 JD，快速生成多版本简历，每个版本精准匹配目标岗位。',
  },
]

/** 打字机效果 hook */
function useTypingEffect(texts, typingSpeed = 80, deleteSpeed = 40, pauseTime = 2000) {
  const [displayText, setDisplayText] = useState('')
  const textIndexRef = useRef(0)
  const charIndexRef = useRef(0)
  const isDeletingRef = useRef(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    function tick() {
      const currentText = texts[textIndexRef.current]
      const isDeleting = isDeletingRef.current
      const charIdx = charIndexRef.current

      if (!isDeleting) {
        if (charIdx < currentText.length) {
          setDisplayText(currentText.slice(0, charIdx + 1))
          charIndexRef.current = charIdx + 1
          timeoutRef.current = setTimeout(tick, typingSpeed)
        } else {
          isDeletingRef.current = true
          timeoutRef.current = setTimeout(tick, pauseTime)
        }
      } else {
        if (charIdx > 0) {
          setDisplayText(currentText.slice(0, charIdx - 1))
          charIndexRef.current = charIdx - 1
          timeoutRef.current = setTimeout(tick, deleteSpeed)
        } else {
          isDeletingRef.current = false
          textIndexRef.current = (textIndexRef.current + 1) % texts.length
          timeoutRef.current = setTimeout(tick, 400)
        }
      }
    }

    timeoutRef.current = setTimeout(tick, 500)
    return () => clearTimeout(timeoutRef.current)
  }, [texts, typingSpeed, deleteSpeed, pauseTime])

  return displayText
}

export default function HomePage() {
  const navigate = useNavigate()
  const typingText = useTypingEffect([
    '让 AI 读懂你的经历',
    '5 分钟搞定一份能投出去的简历',
    '精准匹配目标岗位',
  ])

  return (
    <div className="relative min-h-screen bg-[#fbfbfd] overflow-hidden">
      {/* 渐变光晕背景 */}
      <GradientGlow />

      {/* 装饰光晕 — Apple 风格极淡 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,113,227,0.2) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full blur-[100px] opacity-6 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,113,227,0.12) 0%, transparent 70%)' }} />

      {/* 浮动光点装饰 — Apple Blue，极低透明度 */}
      <div
        className="absolute top-20 left-[10%] w-1.5 h-1.5 rounded-full pointer-events-none"
        style={{ background: 'rgba(0,113,227,0.08)', animation: 'float-orb 8s ease-in-out infinite' }}
      />
      <div
        className="absolute top-40 right-[15%] w-2 h-2 rounded-full pointer-events-none"
        style={{ background: 'rgba(0,113,227,0.06)', animation: 'float-orb 10s ease-in-out infinite 2s' }}
      />
      <div
        className="absolute bottom-32 left-[20%] w-1 h-1 rounded-full pointer-events-none"
        style={{ background: 'rgba(0,113,227,0.05)', animation: 'float-orb 7s ease-in-out infinite 4s' }}
      />

      {/* 主内容层 */}
      <div className="relative z-10">

        {/* ===== Hero ===== */}
        <div className="pt-28 pb-14 px-4 text-center max-w-3xl mx-auto">
          {/* 小标签 */}
          <div className="animate-fade-in-up mb-6">
            <span className="inline-block bg-[#f5f5f7] px-4 py-1.5 rounded-full text-xs text-[#6e6e73] tracking-wider">
              AI-POWERED RESUME BUILDER
            </span>
          </div>

          {/* 主标题 */}
          <h1
            className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight text-[#1d1d1f] animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            AI 简历生成器
          </h1>

          {/* 打字效果副标题 */}
          <div
            className="h-12 flex items-center justify-center mb-8 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <p className="text-xl md:text-2xl text-[#86868b] font-light">
              {typingText}
              <span className="animate-typing-cursor ml-0.5">&nbsp;</span>
            </p>
          </div>

          {/* CTA 按钮 */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={() => navigate('/form')}
              className="relative group px-10 py-4 rounded-full text-lg font-semibold text-white
                         transition-all duration-200
                         bg-[#0071e3] hover:bg-[#0077ed]
                         shadow-sm hover:shadow-md"
            >
              <span className="relative z-10 flex items-center gap-2">
                开始制作简历
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>

          {/* 信任徽章 */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[#86868b] animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              AI 智能润色
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              数据本地存储
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              秒级生成
            </span>
          </div>
        </div>

        {/* ===== 适用场景卡片 ===== */}
        <div className="max-w-4xl mx-auto px-4 pb-12">
          <p className="text-center text-sm text-[#6e6e73] mb-8 tracking-wide animate-fade-in-up">
            无论你处于哪个阶段，都能用得上
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PERSONAS.map((p, i) => (
              <div
                key={p.title}
                className="glass glass-hover rounded-xl p-6 animate-fade-in-up"
                style={{ animationDelay: `${0.15 * (i + 1)}s` }}
              >
                {/* 顶部细线 */}
                <div className="h-px w-12 rounded-full mb-4 bg-[#e8e8ed]" />
                <h3 className="font-semibold text-[#1d1d1f] mb-2 text-base">{p.title}</h3>
                <p className="text-sm text-[#86868b] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 三步流程 ===== */}
        <div className="max-w-lg mx-auto px-4 pb-20 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="glass rounded-2xl p-8">
            <p className="text-center text-xs text-[#6e6e73] mb-8 tracking-wider uppercase">三步完成</p>
            <div className="flex items-center justify-center gap-0">
              {['填写信息', 'AI 润色', '复制使用'].flatMap((label, i) => {
                const step = (
                  <div key={`step-${i}`} className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                                 bg-[#f5f5f7] text-[#1d1d1f] border border-[#e8e8ed]"
                    >
                      {i + 1}
                    </div>
                    <span className="text-xs text-[#86868b] mt-2">{label}</span>
                  </div>
                )
                if (i === 2) return [step]
                return [
                  step,
                  <div key={`arrow-${i}`} className="mx-4 mb-5">
                    <svg className="w-5 h-5 text-[#c7c7cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>,
                ]
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
