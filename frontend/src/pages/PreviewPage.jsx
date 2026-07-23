/**
 * 简历内容结果页（v0.5 — Apple Luxury 主题）
 * AI 生成的简历内容以纯白卡片形式展示，支持：
 * - 每个板块独立复制（格式化纯文本）
 * - 一键复制全文
 * - Bullet 勾选筛选
 * - 在线编辑（点击文字即可修改）
 * - match_reason 展示（每条 bullet 的 JD 匹配说明）
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useResumeStore from '../store/resumeStore'
import AutoResizeTextarea from '../components/AutoResizeTextarea'
import GradientGlow from '../components/GradientGlow'

// ===== 复制按钮组件 =====
function CopyButton({ text, label = '复制' }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
        copied
          ? 'bg-[#0071e3]/10 border-[#0071e3]/30 text-[#0071e3]'
          : 'bg-white/60 border-[#e8e8ed] text-[#6e6e73] hover:bg-white hover:text-[#1d1d1f] hover:border-[#86868b]'
      }`}
    >
      {copied ? '已复制' : label}
    </button>
  )
}

// ===== 板块卡片组件 =====
function SectionCard({ title, children, copyText, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="glass-heavy rounded-xl border border-[#e8e8ed]/60 border-l-[3px] border-l-[#e8e8ed] mb-5 animate-fade-in-up overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 text-sm font-semibold text-[#1d1d1f] group"
        >
          <svg
            className={`w-3.5 h-3.5 text-[#86868b] transition-transform duration-200 group-hover:text-[#6e6e73] ${
              open ? 'rotate-0' : '-rotate-90'
            }`}
            viewBox="0 0 12 12"
            fill="none"
          >
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="tracking-wide">{title}</span>
        </button>
        <div className="flex items-center gap-2">
          {copyText && open && <CopyButton text={copyText} />}
        </div>
      </div>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

// ===== 主组件 =====
export default function PreviewPage() {
  const navigate = useNavigate()
  const store = useResumeStore()
  const resume = store.generatedResume

  const [editData, setEditData] = useState(null)
  const [checkedBullets, setCheckedBullets] = useState({})

  useEffect(() => {
    if (resume) {
      try {
        const cloned = JSON.parse(JSON.stringify(resume))
        setEditData(cloned)
        const checks = {}
        cloned.experience?.forEach((exp, i) => {
          checks[`experience_${i}`] = exp.bullets?.map(() => true) || []
        })
        cloned.project_experience?.forEach((exp, i) => {
          checks[`project_experience_${i}`] = exp.bullets?.map(() => true) || []
        })
        if (cloned.core_strengths?.length > 0) {
          checks['core_strengths'] = cloned.core_strengths.map(() => true)
        }
        setCheckedBullets(checks)
      } catch (err) {
        console.error('PreviewPage: failed to parse resume data', err)
        setEditData(null)
      }
    }
  }, [resume])

  function syncToStore(data) {
    setEditData(data)
    store.setGeneratedResume(data)
  }

  function updateField(path, value) {
    const newData = JSON.parse(JSON.stringify(editData))
    const keys = path.split('.')
    let obj = newData
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
    obj[keys[keys.length - 1]] = value
    syncToStore(newData)
  }

  function toggleBullet(type, expIndex, bulletIndex) {
    setCheckedBullets((prev) => {
      const key = `${type}_${expIndex}`
      const arr = [...(prev[key] || [])]
      arr[bulletIndex] = !arr[bulletIndex]
      return { ...prev, [key]: arr }
    })
  }

  function getBulletText(bullet) {
    if (typeof bullet === 'string') return bullet
    return bullet?.text || ''
  }

  // ===== 格式化纯文本（供复制） =====
  function formatSection(section) {
    switch (section) {
      case 'basic':
        return `${editData.name}\n${editData.phone} | ${editData.email}\n${editData.target_position}`

      case 'objective':
        return editData.job_objective || ''

      case 'career_summary':
        return editData.career_summary || ''

      case 'core_strengths': {
        const csChecks = checkedBullets['core_strengths'] || []
        return (
          editData.core_strengths
            ?.filter((_, i) => csChecks[i] !== false)
            .map((s) => `· ${s}`)
            .join('\n') || ''
        )
      }

      case 'education':
        return (
          editData.education
            ?.map((e) => {
              let line = `${e.school} | ${e.major} | ${e.degree} | ${e.start_year}-${e.end_year}`
              if (e.gpa) line += ` | GPA ${e.gpa}`
              if (e.courses) line += `\n相关课程：${e.courses}`
              return line
            })
            .join('\n\n') || ''
        )

      case 'experience':
      case 'project_experience': {
        const list = editData[section] || []
        return list
          .map((exp, i) => {
            const key = `${section}_${i}`
            const checks = checkedBullets[key] || []
            const header =
              section === 'experience'
                ? `${exp.company} | ${exp.role} | ${exp.start_date} - ${exp.end_date}`
                : `${exp.name} | ${exp.start_date} - ${exp.end_date}`
            const bullets = (exp.bullets || [])
              .filter((_, bi) => checks[bi] !== false)
              .map((b) => `· ${getBulletText(b)}`)
              .join('\n')
            return `${header}\n${bullets}`
          })
          .join('\n\n')
      }

      case 'skills': {
        if (!editData.skills?.length) return ''
        if (editData.skills[0]?.category) {
          return editData.skills.map((g) => `【${g.category}】${g.items.join('、')}`).join('\n')
        }
        return editData.skills.join('、')
      }

      case 'certificates':
        return editData.certificates?.join('\n') || ''

      case 'evaluation':
        return editData.self_evaluation || ''

      case 'interview_tips': {
        if (!editData.interview_tips?.length) return ''
        return editData.interview_tips
          .map((tip) => {
            const qs = tip.questions
              ?.map((q, i) => `Q${i + 1}: ${q.question}\n回答思路：${q.answer_hint}`)
              .join('\n\n')
            return `【${tip.experience_name}】\n${qs}`
          })
          .join('\n\n')
      }

      default:
        return ''
    }
  }

  function formatFullResume() {
    const sections = [
      formatSection('basic'),
      formatSection('objective'),
      formatSection('career_summary'),
      formatSection('core_strengths'),
      '--- 教育经历 ---',
      formatSection('education'),
      '',
      '--- 工作经历 ---',
      formatSection('experience'),
      '',
      '--- 项目经历 ---',
      formatSection('project_experience'),
      '',
      '--- 技能 ---',
      formatSection('skills'),
      '',
      '--- 证书 ---',
      formatSection('certificates'),
      '',
      '--- 自我评价 ---',
      formatSection('evaluation'),
    ]
    return sections.filter((s) => s && s.trim()).join('\n\n')
  }

  if (!resume || !editData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbfbfd]">
        <GradientGlow />
        <p className="text-[#86868b] mb-4 relative z-10">还没有生成简历</p>
        <button
          onClick={() => navigate('/form')}
          className="relative z-10 px-5 py-2.5 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0077ed] transition-colors duration-200"
        >
          返回填写
        </button>
      </div>
    )
  }

  const hasJD = editData.jd_analysis?.key_requirements?.length > 0

  return (
    <div className="min-h-screen relative flex flex-col items-center bg-[#fbfbfd]">
      <GradientGlow />

      {/* 顶部操作栏 */}
      <div className="relative z-10 w-full max-w-5xl pt-8 mb-6 px-4">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => navigate('/form')}
            className="text-[#86868b] hover:text-[#1d1d1f] text-sm transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5m7-7l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            返回修改
          </button>
          <h2 className="text-xl font-bold text-[#1d1d1f]">简历内容</h2>
          <div className="flex gap-2">
            <CopyButton text={formatFullResume()} label="复制全部" />
            <button
              onClick={() => {
                store.setGeneratedResume(null)
                store.setInterviewPrep(null)
                navigate('/')
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/60 border border-[#e8e8ed] text-[#86868b] hover:text-[#6e6e73] hover:border-[#86868b] transition-all"
            >
              再做一份
            </button>
          </div>
        </div>
        <p className="text-xs text-[#86868b]">
          点击任意文字可直接编辑 · 勾选/取消 bullet 控制复制内容 · 每个板块可独立复制
        </p>
        {editData.token_usage?.total_tokens > 0 && (
          <p className="text-xs text-[#86868b] mt-1">AI 消耗：{editData.token_usage.total_tokens} tokens</p>
        )}
      </div>

      <div className="relative z-10 w-full max-w-5xl px-4 pb-16">
        {/* 引导提示 */}
        <div className="glass rounded-xl border border-[#e8e8ed] px-5 py-3 mb-6 text-sm text-[#6e6e73]">
          <div className="flex items-start gap-2.5">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#86868b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4m0-4h.01" strokeLinecap="round" />
            </svg>
            <span>内容已生成完毕。你可以直接编辑修改，然后点击"复制"按钮将内容粘贴到 WPS、超级简历等工具的模板中。</span>
          </div>
        </div>

        {/* === 基本信息 === */}
        <SectionCard title="基本信息" copyText={formatSection('basic')}>
          <div className="space-y-3">
            <div className="flex gap-3 items-center">
              <span className="text-[#86868b] text-sm w-16 shrink-0">姓名</span>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="text-base font-bold text-[#1d1d1f] bg-[#f5f5f7] border border-transparent rounded-lg px-2 py-1 outline-none focus:border-[#0071e3] focus:bg-white focus:shadow-sm transition-all"
              />
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-[#86868b] text-sm w-16 shrink-0">手机</span>
              <input
                type="text"
                value={editData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="text-sm text-[#6e6e73] bg-[#f5f5f7] border border-transparent rounded-lg px-2 py-1 outline-none focus:border-[#0071e3] focus:bg-white focus:shadow-sm transition-all"
              />
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-[#86868b] text-sm w-16 shrink-0">邮箱</span>
              <input
                type="text"
                value={editData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="text-sm text-[#6e6e73] bg-[#f5f5f7] border border-transparent rounded-lg px-2 py-1 outline-none focus:border-[#0071e3] focus:bg-white focus:shadow-sm transition-all"
              />
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-[#86868b] text-sm w-16 shrink-0">目标岗位</span>
              <input
                type="text"
                value={editData.target_position}
                onChange={(e) => updateField('target_position', e.target.value)}
                className="text-sm text-[#6e6e73] bg-[#f5f5f7] border border-transparent rounded-lg px-2 py-1 outline-none focus:border-[#0071e3] focus:bg-white focus:shadow-sm transition-all"
              />
            </div>
          </div>
        </SectionCard>

        {/* === 求职意向 === */}
        {editData.job_objective && (
          <SectionCard title="求职意向" copyText={formatSection('objective')}>
            <AutoResizeTextarea
              value={editData.job_objective}
              onChange={(v) => updateField('job_objective', v)}
              className="text-sm text-[#6e6e73] leading-relaxed bg-[#f5f5f7] border border-transparent rounded-lg px-2 py-1 outline-none focus:border-[#0071e3] focus:bg-white focus:shadow-sm transition-all"
            />
          </SectionCard>
        )}

        {/* === 职业概述 === */}
        {editData.career_summary && (
          <SectionCard title="职业概述" copyText={formatSection('career_summary')}>
            <AutoResizeTextarea
              value={editData.career_summary}
              onChange={(v) => updateField('career_summary', v)}
              className="text-sm text-[#6e6e73] leading-relaxed bg-[#f5f5f7] border border-transparent rounded-lg px-2 py-1 outline-none focus:border-[#0071e3] focus:bg-white focus:shadow-sm transition-all"
            />
          </SectionCard>
        )}

        {/* === 核心优势 === */}
        {editData.core_strengths?.length > 0 && (
          <SectionCard title="核心优势" copyText={formatSection('core_strengths')}>
            <div className="space-y-2.5">
              {editData.core_strengths.map((s, i) => {
                const csChecks = checkedBullets['core_strengths'] || []
                return (
                  <div key={i} className="flex gap-2.5 items-start group">
                    <input
                      type="checkbox"
                      checked={csChecks[i] !== false}
                      onChange={(e) => {
                        const newChecks = { ...checkedBullets }
                        if (!newChecks['core_strengths']) {
                          newChecks['core_strengths'] = editData.core_strengths.map(() => true)
                        }
                        newChecks['core_strengths'][i] = e.target.checked
                        setCheckedBullets(newChecks)
                      }}
                      className="mt-1.5 shrink-0 w-4 h-4 rounded border-[#e8e8ed] bg-white focus:ring-[#0071e3]/20 focus:ring-offset-0"
                    />
                    <div className={`flex-1 transition-opacity duration-200 ${csChecks[i] === false ? 'opacity-25' : ''}`}>
                      <AutoResizeTextarea
                        value={s}
                        onChange={(v) => updateField(`core_strengths.${i}`, v)}
                        className="text-sm text-[#6e6e73] leading-relaxed bg-[#f5f5f7] border border-transparent rounded-lg px-2 py-1 outline-none focus:border-[#0071e3] focus:bg-white focus:shadow-sm transition-all"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        )}

        {/* === 教育经历 === */}
        {editData.education?.length > 0 && (
          <SectionCard title="教育经历" copyText={formatSection('education')}>
            {editData.education.map((e, i) => (
              <div key={i} className={i > 0 ? 'mt-4 pt-4 border-t border-[#e8e8ed]' : ''}>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="font-bold text-[#1d1d1f]">{e.school}</span>
                  <span className="text-[#6e6e73]">
                    {e.major} · {e.degree}
                  </span>
                  <span className="text-[#86868b]">{e.start_year}-{e.end_year}</span>
                  {e.gpa && <span className="text-[#6e6e73]">GPA {e.gpa}</span>}
                </div>
                {e.courses && <p className="text-xs text-[#86868b] mt-1.5">相关课程：{e.courses}</p>}
              </div>
            ))}
          </SectionCard>
        )}

        {/* === 工作经历 === */}
        {editData.experience?.length > 0 && (
          <SectionCard title="工作经历" copyText={formatSection('experience')}>
            {editData.experience.map((exp, ei) => {
              const key = `experience_${ei}`
              const checks = checkedBullets[key] || []
              return (
                <div key={ei} className={ei > 0 ? 'mt-6 pt-6 border-t border-[#e8e8ed]' : ''}>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    <span className="font-bold text-[#1d1d1f]">{exp.company}</span>
                    <span className="text-[#6e6e73]">{exp.role}</span>
                    <span className="text-[#86868b] text-sm">{exp.start_date} - {exp.end_date}</span>
                  </div>
                  {exp.jd_match?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {exp.jd_match.map((m, mi) => (
                        <span
                          key={mi}
                          className="text-xs bg-[#f5f5f7] text-[#6e6e73] border border-[#e8e8ed] px-2 py-0.5 rounded-full"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2.5">
                    {exp.bullets?.map((bullet, bi) => {
                      const text = getBulletText(bullet)
                      const reason = typeof bullet === 'object' ? bullet.match_reason : ''
                      const score = typeof bullet === 'object' ? bullet.match_score : ''
                      return (
                        <div key={bi} className="flex gap-2.5 items-start group">
                          <input
                            type="checkbox"
                            checked={checks[bi] !== false}
                            onChange={() => toggleBullet('experience', ei, bi)}
                            className="mt-1.5 shrink-0 w-4 h-4 rounded border-[#e8e8ed] bg-white focus:ring-[#0071e3]/20 focus:ring-offset-0"
                          />
                          <div className={`flex-1 transition-opacity duration-200 ${checks[bi] === false ? 'opacity-25' : ''}`}>
                            <AutoResizeTextarea
                              value={text}
                              onChange={(v) => {
                                const newData = JSON.parse(JSON.stringify(editData))
                                if (typeof newData.experience[ei].bullets[bi] === 'string') {
                                  newData.experience[ei].bullets[bi] = v
                                } else {
                                  newData.experience[ei].bullets[bi].text = v
                                }
                                syncToStore(newData)
                              }}
                              className="text-sm text-[#6e6e73] leading-relaxed bg-[#f5f5f7] border border-transparent rounded-lg px-2 py-1 outline-none focus:border-[#0071e3] focus:bg-white focus:shadow-sm transition-all"
                            />
                            {reason && (
                              <p className="text-xs text-[#86868b] mt-1">
                                {score && (
                                  <span
                                    className={`inline-block mr-1.5 px-1.5 py-0.5 rounded text-xs font-medium ${
                                      score === 'high'
                                        ? 'bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20'
                                        : score === 'low'
                                        ? 'bg-[#f5f5f7] text-[#86868b] border border-[#e8e8ed]'
                                        : 'bg-[#f5f5f7] text-[#6e6e73] border border-[#e8e8ed]'
                                    }`}
                                  >
                                    {score === 'high' ? '高匹配' : score === 'low' ? '低匹配' : '中匹配'}
                                  </span>
                                )}
                                {reason}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </SectionCard>
        )}

        {/* === 项目经历 === */}
        {editData.project_experience?.length > 0 && (
          <SectionCard title="项目经历" copyText={formatSection('project_experience')}>
            {editData.project_experience.map((exp, ei) => {
              const key = `project_experience_${ei}`
              const checks = checkedBullets[key] || []
              return (
                <div key={ei} className={ei > 0 ? 'mt-6 pt-6 border-t border-[#e8e8ed]' : ''}>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    <span className="font-bold text-[#1d1d1f]">{exp.name}</span>
                    <span className="text-[#86868b] text-sm">{exp.start_date} - {exp.end_date}</span>
                  </div>
                  {exp.jd_match?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {exp.jd_match.map((m, mi) => (
                        <span
                          key={mi}
                          className="text-xs bg-[#f5f5f7] text-[#6e6e73] border border-[#e8e8ed] px-2 py-0.5 rounded-full"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2.5">
                    {exp.bullets?.map((bullet, bi) => {
                      const text = getBulletText(bullet)
                      const reason = typeof bullet === 'object' ? bullet.match_reason : ''
                      const score = typeof bullet === 'object' ? bullet.match_score : ''
                      return (
                        <div key={bi} className="flex gap-2.5 items-start group">
                          <input
                            type="checkbox"
                            checked={checks[bi] !== false}
                            onChange={() => toggleBullet('project_experience', ei, bi)}
                            className="mt-1.5 shrink-0 w-4 h-4 rounded border-[#e8e8ed] bg-white focus:ring-[#0071e3]/20 focus:ring-offset-0"
                          />
                          <div className={`flex-1 transition-opacity duration-200 ${checks[bi] === false ? 'opacity-25' : ''}`}>
                            <AutoResizeTextarea
                              value={text}
                              onChange={(v) => {
                                const newData = JSON.parse(JSON.stringify(editData))
                                if (typeof newData.project_experience[ei].bullets[bi] === 'string') {
                                  newData.project_experience[ei].bullets[bi] = v
                                } else {
                                  newData.project_experience[ei].bullets[bi].text = v
                                }
                                syncToStore(newData)
                              }}
                              className="text-sm text-[#6e6e73] leading-relaxed bg-[#f5f5f7] border border-transparent rounded-lg px-2 py-1 outline-none focus:border-[#0071e3] focus:bg-white focus:shadow-sm transition-all"
                            />
                            {reason && (
                              <p className="text-xs text-[#86868b] mt-1">
                                {score && (
                                  <span
                                    className={`inline-block mr-1.5 px-1.5 py-0.5 rounded text-xs font-medium ${
                                      score === 'high'
                                        ? 'bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20'
                                        : score === 'low'
                                        ? 'bg-[#f5f5f7] text-[#86868b] border border-[#e8e8ed]'
                                        : 'bg-[#f5f5f7] text-[#6e6e73] border border-[#e8e8ed]'
                                    }`}
                                  >
                                    {score === 'high' ? '高匹配' : score === 'low' ? '低匹配' : '中匹配'}
                                  </span>
                                )}
                                {reason}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </SectionCard>
        )}

        {/* === 技能 === */}
        {editData.skills?.length > 0 && (
          <SectionCard title="技能" copyText={formatSection('skills')}>
            {editData.skills[0]?.category ? (
              <div className="space-y-3">
                {editData.skills.map((g, gi) => (
                  <div key={gi} className="flex gap-3">
                    <span className="text-xs font-medium text-[#6e6e73] bg-[#f5f5f7] border border-[#e8e8ed] px-2 py-1 rounded shrink-0 min-w-[60px] text-center">
                      {g.category}
                    </span>
                    <span className="text-sm text-[#6e6e73]">{g.items.join('、')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6e6e73]">{editData.skills.join('、')}</p>
            )}
          </SectionCard>
        )}

        {/* === 证书 === */}
        {editData.certificates?.length > 0 && (
          <SectionCard title="证书" copyText={formatSection('certificates')}>
            <div className="space-y-1.5">
              {editData.certificates.map((c, i) => (
                <p key={i} className="text-sm text-[#6e6e73] flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-[#86868b] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 15l-2 5 2-1 2 1-2-5zm0 0V8m-4 0a4 4 0 118 0H8z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {c}
                </p>
              ))}
            </div>
          </SectionCard>
        )}

        {/* === 自我评价 === */}
        {editData.self_evaluation && (
          <SectionCard title="自我评价" copyText={formatSection('evaluation')}>
            <AutoResizeTextarea
              value={editData.self_evaluation}
              onChange={(v) => updateField('self_evaluation', v)}
              className="text-sm text-[#6e6e73] leading-relaxed bg-[#f5f5f7] border border-transparent rounded-lg px-2 py-1 outline-none focus:border-[#0071e3] focus:bg-white focus:shadow-sm transition-all"
            />
          </SectionCard>
        )}

        {/* === 面试准备（话术） === */}
        {editData.interview_tips?.length > 0 && (
          <SectionCard title="面试准备（话术建议）" copyText={formatSection('interview_tips')}>
            <div className="space-y-5">
              {editData.interview_tips.map((tip, ti) => (
                <div key={ti}>
                  <h4 className="text-sm font-bold text-[#1d1d1f] mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#86868b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M8 21h8m-4-4v4" strokeLinecap="round" />
                    </svg>
                    {tip.experience_name}
                  </h4>
                  {tip.questions?.map((q, qi) => (
                    <div key={qi} className="glass mb-3 rounded-lg p-4">
                      <p className="text-sm text-[#1d1d1f] font-medium mb-1.5">
                        Q{qi + 1}: {q.question}
                      </p>
                      <p className="text-xs text-[#86868b] leading-relaxed">回答思路：{q.answer_hint}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* === JD 匹配分析 === */}
        {hasJD && (
          <SectionCard title="JD 匹配分析">
            <div className="space-y-4">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-[#0071e3]">
                  {editData.jd_analysis?.match_score || '—'}
                </span>
                <span className="text-sm text-[#86868b]">整体匹配度</span>
              </div>
              {editData.jd_analysis?.key_requirements?.length > 0 && (
                <div>
                  <p className="text-xs text-[#86868b] mb-2 uppercase tracking-wider">关键要求</p>
                  <div className="flex flex-wrap gap-1.5">
                    {editData.jd_analysis.key_requirements.map((r, i) => (
                      <span
                        key={i}
                        className="text-xs bg-[#f5f5f7] text-[#6e6e73] border border-[#e8e8ed] px-2 py-0.5 rounded-full"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* === 项目深度分析（面试准备） === */}
        {store.interviewPrep && (
          <SectionCard title="项目深度分析（面试准备清单）">
            <div className="space-y-3">
              {store.interviewPrep.tech_stack?.length > 0 && (
                <div>
                  <p className="text-xs text-[#86868b] mb-2 uppercase tracking-wider">技术栈</p>
                  <div className="flex flex-wrap gap-1.5">
                    {store.interviewPrep.tech_stack.map((t, i) => (
                      <span
                        key={i}
                        className="text-xs bg-[#f5f5f7] text-[#6e6e73] border border-[#e8e8ed] px-2 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {store.interviewPrep.interview_prep?.likely_questions?.map((prep, pi) => (
                <div key={pi} className="glass rounded-lg p-4">
                  <p className="text-sm text-[#1d1d1f] font-medium mb-1.5">
                    Q{pi + 1}: {prep.question}
                  </p>
                  <p className="text-xs text-[#86868b] leading-relaxed">回答思路：{prep.hint}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
