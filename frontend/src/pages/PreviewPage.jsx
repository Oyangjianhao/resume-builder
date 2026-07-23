/**
 * 简历内容结果页（v0.2）
 * AI 生成的简历内容以卡片形式展示，支持：
 * - 每个板块独立复制（格式化纯文本）
 * - 一键复制全文
 * - Bullet 勾选筛选
 * - 在线编辑（点击文字即可修改）
 * - match_reason 展示（每条 bullet 的 JD 匹配说明）
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useResumeStore from '../store/resumeStore'
import AutoResizeTextarea from '../components/AutoResizeTextarea'

// ===== 复制按钮组件 =====
function CopyButton({ text, label = '复制' }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback
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
      className={`text-xs px-2 py-1 rounded transition-colors ${
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {copied ? '已复制 ✓' : label}
    </button>
  )
}

// ===== 板块卡片组件 =====
function SectionCard({ title, children, copyText, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white shadow-card border border-gray-200 rounded-lg mb-4 animate-fade-in-up">
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm font-bold text-gray-700"
        >
          <svg className={`w-3 h-3 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`} viewBox="0 0 12 12" fill="none">
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {title}
        </button>
        <div className="flex items-center gap-2">
          {copyText && open && <CopyButton text={copyText} />}
        </div>
      </div>
      {open && <div className="px-5 py-4 overflow-visible">{children}</div>}
    </div>
  )
}

// ===== 可编辑文本组件 =====
function EditableText({ value, onChange, className = '', multiline = false }) {
  if (multiline) {
    return (
      <AutoResizeTextarea
        value={value}
        onChange={onChange}
        className={`w-full border-none outline-none bg-transparent focus:ring-1 focus:ring-primary-200 rounded px-1 ${className}`}
      />
    )
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border-none outline-none bg-transparent focus:ring-1 focus:ring-primary-200 rounded px-1 ${className}`}
    />
  )
}

// ===== 主组件 =====
export default function PreviewPage() {
  const navigate = useNavigate()
  const store = useResumeStore()
  const resume = store.generatedResume

  const [editData, setEditData] = useState(null)
  // bullet 勾选状态：{ "experience_0": [true, true, false], "project_experience_1": [true] }
  const [checkedBullets, setCheckedBullets] = useState({})

  useEffect(() => {
    if (resume) {
      const cloned = JSON.parse(JSON.stringify(resume))
      setEditData(cloned)
      // 初始化全部勾选
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

  // ===== 获取 bullet 文本（兼容旧格式） =====
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

      case 'core_strengths':
        return editData.core_strengths?.map((s) => `· ${s}`).join('\n') || ''

      case 'education':
        return editData.education
          ?.map((e) => {
            let line = `${e.school} | ${e.major} | ${e.degree} | ${e.start_year}-${e.end_year}`
            if (e.gpa) line += ` | GPA ${e.gpa}`
            if (e.courses) line += `\n相关课程：${e.courses}`
            return line
          })
          .join('\n\n') || ''

      case 'experience':
      case 'project_experience': {
        const list = editData[section] || []
        return list
          .map((exp, i) => {
            const key = `${section}_${i}`
            const checks = checkedBullets[key] || []
            const header = section === 'experience'
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
        // 新格式（SkillGroup[]）
        if (editData.skills[0]?.category) {
          return editData.skills
            .map((g) => `【${g.category}】${g.items.join('、')}`)
            .join('\n')
        }
        // 旧格式（str[]）
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

  // 如果还没生成过简历，跳回填写页
  if (!resume || !editData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">还没有生成简历</p>
        <button onClick={() => navigate('/form')} className="text-primary-600 hover:underline">
          返回填写
        </button>
      </div>
    )
  }

  const hasJD = editData.jd_analysis?.key_requirements?.length > 0

  return (
    <div className="min-h-screen bg-surface py-8">
      {/* 顶部操作栏 */}
      <div className="max-w-3xl mx-auto mb-6 px-4">
        <div className="flex justify-between items-center mb-3">
          <button onClick={() => navigate('/form')} className="text-gray-500 hover:text-gray-700 text-sm">
            ← 返回修改
          </button>
          <h2 className="text-xl font-bold text-slate-800">简历内容</h2>
          <div className="flex gap-2">
            <CopyButton text={formatFullResume()} label="复制全部" />
            <button
              onClick={() => {
                store.setGeneratedResume(null)
                store.setInterviewPrep(null)
                navigate('/')
              }}
              className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              再做一份
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          点击任意文字可直接编辑 · 勾选/取消 bullet 控制复制内容 · 每个板块可独立复制
        </p>
        {editData.token_usage?.total_tokens > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            AI 消耗：{editData.token_usage.total_tokens} tokens
          </p>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {/* 引导提示 */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 mb-6 text-sm text-primary-700">
          内容已生成完毕。你可以直接编辑修改，然后点击"复制"按钮将内容粘贴到 WPS、超级简历等工具的模板中。
        </div>

        {/* === 基本信息 === */}
        <SectionCard title="基本信息" copyText={formatSection('basic')}>
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <span className="text-gray-400 text-sm w-16 shrink-0">姓名</span>
              <EditableText value={editData.name} onChange={(v) => updateField('name', v)} className="text-base font-bold" />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-gray-400 text-sm w-16 shrink-0">手机</span>
              <EditableText value={editData.phone} onChange={(v) => updateField('phone', v)} className="text-sm" />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-gray-400 text-sm w-16 shrink-0">邮箱</span>
              <EditableText value={editData.email} onChange={(v) => updateField('email', v)} className="text-sm" />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-gray-400 text-sm w-16 shrink-0">目标岗位</span>
              <EditableText value={editData.target_position} onChange={(v) => updateField('target_position', v)} className="text-sm" />
            </div>
          </div>
        </SectionCard>

        {/* === 求职意向 === */}
        {editData.job_objective && (
          <SectionCard title="求职意向" copyText={formatSection('objective')}>
            <EditableText
              value={editData.job_objective}
              onChange={(v) => updateField('job_objective', v)}
              className="text-sm text-gray-700"
            />
          </SectionCard>
        )}

        {/* === 职业概述 === */}
        {editData.career_summary && (
          <SectionCard title="职业概述" copyText={formatSection('career_summary')}>
            <AutoResizeTextarea
              value={editData.career_summary}
              onChange={(v) => updateField('career_summary', v)}
              className="text-sm text-gray-700 leading-relaxed"
            />
          </SectionCard>
        )}

        {/* === 核心优势 === */}
        {editData.core_strengths?.length > 0 && (
          <SectionCard title="核心优势" copyText={formatSection('core_strengths')}>
            <div className="space-y-2">
              {editData.core_strengths.map((s, i) => {
                const csChecks = checkedBullets['core_strengths'] || []
                return (
                  <div key={i} className="flex gap-2 items-start">
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
                      className="mt-1.5 shrink-0 accent-primary-500"
                    />
                    <div className={`flex-1 ${csChecks[i] === false ? 'opacity-30' : ''}`}>
                      <AutoResizeTextarea
                        value={s}
                        onChange={(v) => updateField(`core_strengths.${i}`, v)}
                        className="text-sm text-gray-700"
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
              <div key={i} className={i > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="font-bold text-slate-800">{e.school}</span>
                  <span className="text-gray-600">{e.major} · {e.degree}</span>
                  <span className="text-gray-400">{e.start_year}-{e.end_year}</span>
                  {e.gpa && <span className="text-gray-500">GPA {e.gpa}</span>}
                </div>
                {e.courses && (
                  <p className="text-xs text-gray-500 mt-1">相关课程：{e.courses}</p>
                )}
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
                <div key={ei} className={ei > 0 ? 'mt-6 pt-6 border-t border-gray-100' : ''}>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    <span className="font-bold text-slate-800">{exp.company}</span>
                    <span className="text-gray-600">{exp.role}</span>
                    <span className="text-gray-400 text-sm">{exp.start_date} - {exp.end_date}</span>
                  </div>
                  {exp.jd_match?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {exp.jd_match.map((m, mi) => (
                        <span key={mi} className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded">{m}</span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    {exp.bullets?.map((bullet, bi) => {
                      const text = getBulletText(bullet)
                      const reason = typeof bullet === 'object' ? bullet.match_reason : ''
                      const score = typeof bullet === 'object' ? bullet.match_score : ''
                      return (
                        <div key={bi} className="flex gap-2 items-start">
                          <input
                            type="checkbox"
                            checked={checks[bi] !== false}
                            onChange={() => toggleBullet('experience', ei, bi)}
                            className="mt-1.5 shrink-0 accent-primary-500"
                          />
                          <div className={`flex-1 ${checks[bi] === false ? 'opacity-30' : ''}`}>
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
                              className="text-sm text-gray-700 leading-relaxed"
                            />
                            {reason && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {score && (
                                  <span className={`inline-block mr-1 px-1 rounded text-xs ${
                                    score === 'high' ? 'bg-primary-50 text-primary-700' :
                                    score === 'low' ? 'bg-gray-100 text-gray-500' :
                                    'bg-accent-50 text-accent-600'
                                  }`}>{score === 'high' ? '高' : score === 'low' ? '低' : '中'}</span>
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
                <div key={ei} className={ei > 0 ? 'mt-6 pt-6 border-t border-gray-100' : ''}>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    <span className="font-bold text-slate-800">{exp.name}</span>
                    <span className="text-gray-400 text-sm">{exp.start_date} - {exp.end_date}</span>
                  </div>
                  {exp.jd_match?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {exp.jd_match.map((m, mi) => (
                        <span key={mi} className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded">{m}</span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    {exp.bullets?.map((bullet, bi) => {
                      const text = getBulletText(bullet)
                      const reason = typeof bullet === 'object' ? bullet.match_reason : ''
                      const score = typeof bullet === 'object' ? bullet.match_score : ''
                      return (
                        <div key={bi} className="flex gap-2 items-start">
                          <input
                            type="checkbox"
                            checked={checks[bi] !== false}
                            onChange={() => toggleBullet('project_experience', ei, bi)}
                            className="mt-1.5 shrink-0 accent-primary-500"
                          />
                          <div className={`flex-1 ${checks[bi] === false ? 'opacity-30' : ''}`}>
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
                              className="text-sm text-gray-700 leading-relaxed"
                            />
                            {reason && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {score && (
                                  <span className={`inline-block mr-1 px-1 rounded text-xs ${
                                    score === 'high' ? 'bg-primary-50 text-primary-700' :
                                    score === 'low' ? 'bg-gray-100 text-gray-500' :
                                    'bg-accent-50 text-accent-600'
                                  }`}>{score === 'high' ? '高' : score === 'low' ? '低' : '中'}</span>
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
            {/* 新格式：分类展示 */}
            {editData.skills[0]?.category ? (
              <div className="space-y-3">
                {editData.skills.map((group, gi) => (
                  <div key={gi}>
                    <p className="text-xs font-bold text-gray-500 mb-1">{group.category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item, ii) => (
                        <span key={ii} className="text-sm bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* 旧格式：扁平列表 */
              <div className="flex flex-wrap gap-1.5">
                {editData.skills.map((s, i) => (
                  <span key={i} className="text-sm bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* === 证书 === */}
        {editData.certificates?.length > 0 && (
          <SectionCard title="证书" copyText={formatSection('certificates')}>
            <div className="flex flex-wrap gap-2">
              {editData.certificates.map((c, i) => (
                <span key={i} className="text-sm bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1 rounded">
                  {c}
                </span>
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
              className="text-sm text-gray-700 leading-relaxed"
            />
          </SectionCard>
        )}

        {/* === 面试话术 === */}
        {editData.interview_tips?.length > 0 && (
          <SectionCard title="面试话术 / 准备建议" copyText={formatSection('interview_tips')} defaultOpen={true}>
            {editData.interview_tips.map((tip, ti) => (
              <div key={ti} className={ti > 0 ? 'mt-5 pt-5 border-t border-gray-100' : ''}>
                <p className="text-sm font-bold text-gray-700 mb-2">{tip.experience_name}</p>
                {tip.questions?.map((q, qi) => (
                  <div key={qi} className="mb-3 pl-3 border-l-2 border-primary-200">
                    <p className="text-sm text-slate-800">Q: {q.question}</p>
                    <p className="text-sm text-gray-500 mt-1">回答思路：{q.answer_hint}</p>
                  </div>
                ))}
              </div>
            ))}
          </SectionCard>
        )}

        {/* === JD 匹配分析 === */}
        {hasJD && (
          <SectionCard title="JD 匹配分析" defaultOpen={true}>
            {/* 匹配度评分 */}
            {editData.jd_analysis.match_score && (
              <div className="mb-4 p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">综合匹配度</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {editData.jd_analysis.match_score}
                  </span>
                </div>
              </div>
            )}
            {editData.jd_analysis.key_requirements?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 font-medium mb-2">JD 关键要求</p>
                <div className="flex flex-wrap gap-2">
                  {editData.jd_analysis.key_requirements.map((req, i) => (
                    <span key={i} className="bg-primary-50 text-primary-600 text-xs px-2 py-1 rounded">{req}</span>
                  ))}
                </div>
              </div>
            )}
            {editData.jd_analysis.matched_projects?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 font-medium mb-2">匹配的项目</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {editData.jd_analysis.matched_projects.map((proj, i) => (
                    <li key={i}>· {proj}</li>
                  ))}
                </ul>
              </div>
            )}
            {editData.jd_analysis.gaps?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 font-medium mb-2">待弥补的差距</p>
                <ul className="space-y-2">
                  {editData.jd_analysis.gaps.map((item, i) => {
                    // 兼容旧格式（纯字符串）和新格式（{gap, suggestion}）
                    const gapText = typeof item === 'string' ? item : item.gap
                    const suggestion = typeof item === 'string' ? null : item.suggestion
                    return (
                      <li key={i} className="text-sm">
                        <span className="text-orange-600">· {gapText}</span>
                        {suggestion && (
                          <p className="text-xs text-gray-400 mt-0.5 ml-3 pl-2 border-l-2 border-orange-200">
                            {suggestion}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </SectionCard>
        )}

        {/* === 项目深度分析的面试准备（如果有） === */}
        {store.interviewPrep?.interview_prep && (
          <SectionCard title="项目深度分析 - 面试准备" defaultOpen={true}>
            {/* 项目-JD 关联度评估 */}
            {store.interviewPrep.jd_project_relevance && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">项目-JD 关联度：</span>
                  <span className={`inline-block text-xs font-medium rounded px-2 py-0.5 ${
                    store.interviewPrep.jd_project_relevance === 'high' ? 'bg-green-100 text-green-700' :
                    store.interviewPrep.jd_project_relevance === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {store.interviewPrep.jd_project_relevance === 'high' ? '高' :
                     store.interviewPrep.jd_project_relevance === 'partial' ? '部分' : '低'}
                  </span>
                </div>
                {store.interviewPrep.relevance_reason && (
                  <p className="text-xs text-gray-500">{store.interviewPrep.relevance_reason}</p>
                )}
              </div>
            )}
            {/* JD 核心维度（JD 模式下才有） */}
            {store.interviewPrep.jd_dimensions?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 font-medium mb-2">JD 核心维度</p>
                <div className="flex flex-wrap gap-1.5">
                  {store.interviewPrep.jd_dimensions.map((dim, i) => (
                    <span key={i} className="inline-block text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded px-2 py-0.5">{dim}</span>
                  ))}
                </div>
              </div>
            )}
            {store.interviewPrep.interview_prep.key_technologies?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 font-medium mb-2">需要掌握的核心技术</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {store.interviewPrep.interview_prep.key_technologies.map((tech, i) => (
                    <li key={i}>· {tech}</li>
                  ))}
                </ul>
              </div>
            )}
            {store.interviewPrep.interview_prep.likely_questions?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 font-medium mb-2">可能被问到的问题</p>
                {store.interviewPrep.interview_prep.likely_questions.map((q, i) => (
                  <div key={i} className="mb-3 pl-3 border-l-2 border-primary-200">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {q.jd_requirement && (
                        <span className="inline-block text-xs bg-primary-100 text-primary-800 rounded px-1.5 py-0.5">JD: {q.jd_requirement}</span>
                      )}
                      {q.question_type && (
                        <span className="inline-block text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{q.question_type}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800">Q: {q.question}</p>
                    <p className="text-sm text-gray-500 mt-1">提示：{q.hint}</p>
                  </div>
                ))}
              </div>
            )}
            {store.interviewPrep.interview_prep.study_tips && (
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">学习建议</p>
                <p className="text-sm text-gray-600">{store.interviewPrep.interview_prep.study_tips}</p>
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  )
}
