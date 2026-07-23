/**
 * 信息填写页（分步表单）
 * 5 个步骤：基本信息 → 目标岗位 → 教育经历 → 经历 → 技能证书 + 生成
 */
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useResumeStore from '../store/resumeStore'
import { generateResume, analyzeProject } from '../services/api'
import GradientGlow from '../components/GradientGlow'

const STEPS = ['基本信息', '目标岗位', '教育经历', '经历', '技能证书']

// ===== 通用输入组件（放在 FormPage 外面，避免每次渲染被重建） =====
function Input({ label, value, onChange, placeholder, required }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[#6e6e73] mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-[#e8e8ed] rounded-lg px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all duration-200"
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[#6e6e73] mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-white border border-[#e8e8ed] rounded-lg px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all duration-200 resize-y"
      />
    </div>
  )
}

// ===== 步骤指示器 =====
function StepIndicator({ currentStep, setCurrentStep }) {
  return (
    <div className="flex items-start mb-10">
      {STEPS.flatMap((label, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < currentStep
        const isCurrent = stepNum === currentStep

        const dot = (
          <div
            key={`step-${i}`}
            className={`flex flex-col items-center shrink-0 transition-all duration-300 ${
              isCompleted ? 'cursor-pointer group' : isCurrent ? '' : ''
            }`}
            onClick={() => isCompleted && setCurrentStep(stepNum)}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                isCompleted
                  ? 'bg-[#0071e3] text-white scale-100 group-hover:scale-105'
                  : isCurrent
                  ? 'bg-white text-[#0071e3] border-2 border-[#0071e3]'
                  : 'bg-[#f5f5f7] border border-[#e8e8ed] text-[#86868b]'
              }`}
            >
              {isCompleted ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                stepNum
              )}
            </div>
            <span
              className={`text-xs mt-1.5 whitespace-nowrap transition-colors duration-200 ${
                isCompleted
                  ? 'text-[#0071e3] group-hover:text-[#0077ed]'
                  : isCurrent
                  ? 'text-[#0071e3] font-semibold'
                  : 'text-[#86868b]'
              }`}
            >
              {label}
            </span>
          </div>
        )

        if (i === STEPS.length - 1) return [dot]

        const connector = (
          <div
            key={`line-${i}`}
            className={`flex-1 h-px mx-2 mt-4 transition-all duration-500 ${
              isCompleted ? 'bg-[#0071e3]/30' : 'bg-[#e8e8ed]'
            }`}
          />
        )

        return [dot, connector]
      })}
    </div>
  )
}

// ===== 主组件 =====
export default function FormPage() {
  const navigate = useNavigate()
  const store = useResumeStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jdTab, setJdTab] = useState('manual') // 'manual' | 'jd'
  const [analyzing, setAnalyzing] = useState(-1) // 正在分析的项目经历 index，-1 表示无
  const [analysisResult, setAnalysisResult] = useState({}) // 各项目经历的分析结果
  const [toastVisible, setToastVisible] = useState(false)
  const fileInputRef = useRef(null)
  const analyzingIndexRef = useRef(-1) // 当前正在上传的项目索引

  // ===== 项目文件分析 =====
  async function handleAnalyze(index) {
    analyzingIndexRef.current = index
    fileInputRef.current?.click()
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const index = analyzingIndexRef.current
    setAnalyzing(index)

    try {
      const result = await analyzeProject(file, '', store.targetPosition, store.jobDescription)
      // 将分析结果的 bullets 填入项目描述
      const project = store.projectExperience[index]
      if (project && result.bullets?.length > 0) {
        const newList = [...store.projectExperience]
        newList[index] = {
          ...project,
          description: project.description
            ? project.description + '\n\n[AI 分析]\n' + result.bullets.join('\n')
            : '[AI 分析]\n' + result.bullets.join('\n'),
        }
        store.setProjectExperience(newList)
      }
      // 保存完整分析结果（面试准备清单等）
      setAnalysisResult((prev) => ({ ...prev, [index]: result }))
      // 存储到 store 的面试准备清单（取最新的一个）
      if (result.interview_prep) {
        store.setInterviewPrep(result)
      }
    } catch (err) {
      setError(err.message || '项目分析失败')
    } finally {
      setAnalyzing(-1)
      // 清空 file input，允许重复上传同一文件
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ===== 点击"AI 生成简历" =====
  async function handleGenerate() {
    if (!store.targetPosition) {
      setError('请先填写目标岗位')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = store.buildRequestData()
      const result = await generateResume(data)
      store.setGeneratedResume(result)
      // 显示 toast 后跳转
      setToastVisible(true)
      setTimeout(() => {
        navigate('/preview')
      }, 1200)
    } catch (e) {
      setError(e.message || '生成失败，请检查后端服务是否启动')
    } finally {
      setLoading(false)
    }
  }

  // ===== 渲染当前步骤的内容 =====
  function renderStep() {
    // ----- 第 1 步：基本信息 -----
    if (store.currentStep === 1) {
      const p = store.personal
      const update = (key, val) => store.setPersonal({ ...p, [key]: val })
      return (
        <div className="animate-fade-in">
          <h3 className="text-xl font-bold text-[#1d1d1f] mb-6">基本信息</h3>
          <Input label="姓名" value={p.name} onChange={(v) => update('name', v)} placeholder="请输入姓名" required />
          <Input label="手机号" value={p.phone} onChange={(v) => update('phone', v)} placeholder="请输入手机号" required />
          <Input label="邮箱" value={p.email} onChange={(v) => update('email', v)} placeholder="请输入邮箱" required />
          <Input label="一句话介绍自己（选填）" value={p.selfIntro} onChange={(v) => update('selfIntro', v)} placeholder="一句话介绍自己，比如：学习方向、性格特点" />
        </div>
      )
    }

    // ----- 第 2 步：目标岗位 + JD -----
    if (store.currentStep === 2) {
      return (
        <div className="animate-fade-in">
          <h3 className="text-xl font-bold text-[#1d1d1f] mb-6">目标岗位</h3>

          {/* Tab 切换 */}
          <div className="flex mb-6 border-b border-[#e8e8ed]">
            <button
              onClick={() => setJdTab('manual')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
                jdTab === 'manual'
                  ? 'border-[#0071e3] text-[#0071e3]'
                  : 'border-transparent text-[#86868b] hover:text-[#6e6e73]'
              }`}
            >
              手动输入岗位名称
            </button>
            <button
              onClick={() => setJdTab('jd')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
                jdTab === 'jd'
                  ? 'border-[#0071e3] text-[#0071e3]'
                  : 'border-transparent text-[#86868b] hover:text-[#6e6e73]'
              }`}
            >
              粘贴招聘信息
            </button>
          </div>

          {/* Tab 1：手动输入 */}
          {jdTab === 'manual' && (
            <div>
              <Input
                label="你想应聘什么岗位？"
                value={store.targetPosition}
                onChange={store.setTargetPosition}
                placeholder="比如：产品经理、市场专员、前端开发"
                required
              />
              <p className="text-sm text-[#86868b] mt-1.5">
                AI 会根据目标岗位调整简历的侧重点和关键词
              </p>
            </div>
          )}

          {/* Tab 2：粘贴 JD */}
          {jdTab === 'jd' && (
            <div>
              <Input
                label="岗位名称"
                value={store.targetPosition}
                onChange={store.setTargetPosition}
                placeholder="比如：产品经理、市场专员、前端开发"
                required
              />
              <TextArea
                label="招聘信息（从招聘平台复制粘贴，可选）"
                value={store.jobDescription}
                onChange={store.setJobDescription}
                placeholder={"从 Boss 直聘、拉勾、牛客等招聘平台复制岗位描述和任职要求，粘贴到这里。\n\n例如：\n岗位职责：\n1. 负责公司后端系统的开发与维护\n2. 参与系统架构设计...\n\n任职要求：\n1. 本科及以上学历，计算机相关专业\n2. 3年以上 Java 开发经验..."}
                rows={8}
              />
              <p className="text-sm text-[#86868b] mt-1.5">
                AI 会根据 JD 中的关键词精准调整简历，突出匹配的技能和经历
              </p>
            </div>
          )}
        </div>
      )
    }

    // ----- 第 3 步：教育经历 -----
    if (store.currentStep === 3) {
      const list = store.education
      const updateItem = (index, key, val) => {
        const newList = [...list]
        newList[index] = { ...newList[index], [key]: val }
        store.setEducation(newList)
      }
      return (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-[#1d1d1f]">教育经历</h3>
            <button onClick={store.addEducation} className="text-[#0071e3] text-sm hover:text-[#0077ed] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#0071e3]/5">
              + 添加一段
            </button>
          </div>
          {list.length === 0 && (
            <p className="text-[#86868b] text-sm text-center py-12">还没有添加教育经历，点上方"+ 添加一段"</p>
          )}
          {list.map((edu, i) => (
            <div key={i} className="glass rounded-xl p-5 mb-4 relative">
              {list.length > 1 && (
                <button onClick={() => store.removeEducation(i)} className="absolute top-3 right-3 text-[#86868b] text-sm hover:text-rose-400 transition-colors">删除</button>
              )}
              <Input label="学校" value={edu.school} onChange={(v) => updateItem(i, 'school', v)} placeholder="请输入学校名称" />
              <Input label="专业" value={edu.major} onChange={(v) => updateItem(i, 'major', v)} placeholder="请输入专业名称" />
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#6e6e73] mb-1.5">学历</label>
                  <select
                    value={edu.degree}
                    onChange={(e) => updateItem(i, 'degree', e.target.value)}
                    className="w-full bg-white border border-[#e8e8ed] rounded-lg px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all duration-200 appearance-none"
                  >
                    <option value="" disabled>请选择学历</option>
                    <option>本科</option>
                    <option>硕士</option>
                    <option>博士</option>
                    <option>大专</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#6e6e73] mb-1.5">入学年份</label>
                    <input type="month" value={edu.startYear} onChange={(e) => updateItem(i, 'startYear', e.target.value)}
                      className="w-full bg-white border border-[#e8e8ed] rounded-lg px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all duration-200" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#6e6e73] mb-1.5">毕业年份</label>
                    <input type="month" value={edu.endYear} onChange={(e) => updateItem(i, 'endYear', e.target.value)}
                      className="w-full bg-white border border-[#e8e8ed] rounded-lg px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all duration-200" />
                  </div>
                </div>
              </div>
              <Input label="GPA（选填）" value={edu.gpa} onChange={(v) => updateItem(i, 'gpa', v)} placeholder="如 3.5/4.0" />
              <Input label="相关课程（选填）" value={edu.courses} onChange={(v) => updateItem(i, 'courses', v)} placeholder="如：高等数学、大学英语、计算机基础" />
            </div>
          ))}
        </div>
      )
    }

    // ----- 第 4 步：工作经历 + 项目经历 -----
    if (store.currentStep === 4) {
      const workList = store.workExperience
      const projectList = store.projectExperience
      const updateWork = (index, key, val) => {
        const newList = [...workList]
        newList[index] = { ...newList[index], [key]: val }
        store.setWorkExperience(newList)
      }
      const updateProject = (index, key, val) => {
        const newList = [...projectList]
        newList[index] = { ...newList[index], [key]: val }
        store.setProjectExperience(newList)
      }
      const totalExp = workList.length + projectList.length
      return (
        <div className="animate-fade-in">
          <h3 className="text-xl font-bold text-[#1d1d1f] mb-1">经历</h3>
          <p className="text-sm text-[#86868b] mb-6">
            工作经历和项目经历可以自由混合添加
            {store.targetPosition && (
              <span className="ml-2 text-[#0071e3]/80">· 目标：{store.targetPosition}</span>
            )}
          </p>

          {/* 两个添加按钮 */}
          <div className="flex gap-3 mb-6">
            <button onClick={store.addWorkExperience} className="text-[#0071e3] text-sm rounded-lg px-4 py-2 bg-[#0071e3]/5 border border-[#0071e3]/20 hover:bg-[#0071e3]/10 transition-all duration-200">
              + 添加工作经历
            </button>
            <button onClick={store.addProjectExperience} className="text-[#0071e3] text-sm rounded-lg px-4 py-2 bg-[#0071e3]/5 border border-[#0071e3]/20 hover:bg-[#0071e3]/10 transition-all duration-200">
              + 添加项目经历
            </button>
          </div>

          {totalExp === 0 && (
            <p className="text-[#86868b] text-sm text-center py-12">还没有添加经历，点击上方按钮添加</p>
          )}

          {/* 工作经历卡片 */}
          {workList.map((exp, i) => (
            <div key={`work-${i}`} className="glass rounded-xl p-5 mb-4 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#6e6e73] bg-[#f5f5f7] px-2.5 py-1 rounded-full tracking-wide uppercase">工作经历</span>
                {totalExp > 1 && (
                  <button onClick={() => store.removeWorkExperience(i)} className="text-[#86868b] text-sm hover:text-rose-400 transition-colors">删除</button>
                )}
              </div>
              <Input label="公司名称" value={exp.company} onChange={(v) => updateWork(i, 'company', v)} placeholder="XX科技有限公司" />
              <Input label="职位" value={exp.role} onChange={(v) => updateWork(i, 'role', v)} placeholder="请输入职位名称" />
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#6e6e73] mb-1.5">开始时间</label>
                  <input type="month" value={exp.startDate} onChange={(e) => updateWork(i, 'startDate', e.target.value)}
                    className="w-full bg-white border border-[#e8e8ed] rounded-lg px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all duration-200" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#6e6e73] mb-1.5">结束时间</label>
                  <input type="month" value={exp.endDate} onChange={(e) => updateWork(i, 'endDate', e.target.value)}
                    className="w-full bg-white border border-[#e8e8ed] rounded-lg px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all duration-200" />
                </div>
              </div>
              <TextArea
                label="做了什么（随意写，AI 会帮你润色成专业语言）"
                value={exp.description}
                onChange={(v) => updateWork(i, 'description', v)}
                placeholder="比如：负责公司微信公众号的内容编辑和推送，每周策划选题，阅读量从 200 提升到 2000+..."
                rows={5}
              />
            </div>
          ))}

          {/* 项目经历卡片 */}
          {projectList.map((exp, i) => (
            <div key={`project-${i}`} className="glass rounded-xl p-5 mb-4 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#6e6e73] bg-[#f5f5f7] px-2.5 py-1 rounded-full tracking-wide uppercase">项目经历</span>
                {totalExp > 1 && (
                  <button onClick={() => store.removeProjectExperience(i)} className="text-[#86868b] text-sm hover:text-rose-400 transition-colors">删除</button>
                )}
              </div>
              <Input label="项目名称" value={exp.name} onChange={(v) => updateProject(i, 'name', v)} placeholder="请输入项目名称" />
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#6e6e73] mb-1.5">开始时间</label>
                  <input type="month" value={exp.startDate} onChange={(e) => updateProject(i, 'startDate', e.target.value)}
                    className="w-full bg-white border border-[#e8e8ed] rounded-lg px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all duration-200" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#6e6e73] mb-1.5">结束时间</label>
                  <input type="month" value={exp.endDate} onChange={(e) => updateProject(i, 'endDate', e.target.value)}
                    className="w-full bg-white border border-[#e8e8ed] rounded-lg px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 transition-all duration-200" />
                </div>
              </div>
              <TextArea
                label="做了什么（随意写，AI 会帮你润色成专业语言）"
                value={exp.description}
                onChange={(v) => updateProject(i, 'description', v)}
                placeholder="比如：做了一个在线点餐网站，用户可以浏览菜单、加入购物车、下单支付，后台用 Node.js + MongoDB..."
                rows={5}
              />
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => handleAnalyze(i)}
                  disabled={analyzing === i}
                  className="text-sm text-[#0071e3] rounded-lg px-3.5 py-2 bg-[#0071e3]/5 border border-[#0071e3]/20 hover:bg-[#0071e3]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {analyzing === i ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      分析中...
                    </span>
                  ) : '导入项目文件深度分析'}
                </button>
                {analysisResult[i] && (
                  <span className="text-xs text-[#86868b]">
                    已分析 · 识别技术栈: {(analysisResult[i].tech_stack || []).join(', ')}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* 隐藏的文件上传 input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.docx,.pdf,.txt,.md"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )
    }

    // ----- 第 5 步：技能证书 + 生成 -----
    if (store.currentStep === 5) {
      return (
        <div className="animate-fade-in">
          <h3 className="text-xl font-bold text-[#1d1d1f] mb-6">技能与证书</h3>
          <TextArea
            label="列出你的技术栈、语言能力、证书等"
            value={store.skills}
            onChange={store.setSkills}
            placeholder={"比如：Python, JavaScript, Git, VS Code\n英语 CET-6\n计算机二级"}
            rows={6}
          />

          {/* 生成提示 */}
          <div className="mt-6 p-5 bg-[#f5f5f7] rounded-xl">
            <div className="flex items-center gap-2.5 mb-1.5">
              <svg className="w-4 h-4 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-sm text-[#1d1d1f] font-semibold">准备生成简历</p>
            </div>
            <p className="text-xs text-[#86868b] ml-6.5">
              点击下方按钮，AI 将根据你的目标岗位
              {store.jobDescription ? '和招聘信息' : ''}
              智能润色所有经历，生成专业简历。
            </p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="relative min-h-screen bg-[#fbfbfd] overflow-hidden">
      <GradientGlow />

      {/* 返回首页按钮 */}
      <div className="relative z-10 max-w-2xl mx-auto pt-6 px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-[#86868b] hover:text-[#6e6e73] text-sm transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </button>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto py-6 px-4">
        {/* 表单卡片 */}
        <div className="glass rounded-2xl p-8 md:p-10 animate-fade-in">
          <StepIndicator currentStep={store.currentStep} setCurrentStep={store.setCurrentStep} />

          {/* 当前步骤的内容 */}
          {renderStep()}

          {/* 底部按钮 */}
          <div className="flex justify-between items-center mt-10 pt-5 border-t border-[#e8e8ed]">
            <button
              onClick={() => store.currentStep === 1 ? navigate('/') : store.prevStep()}
              className="text-[#86868b] hover:text-[#6e6e73] text-sm font-medium transition-colors"
            >
              {store.currentStep === 1 ? '返回首页' : '上一步'}
            </button>

            {store.currentStep < 5 ? (
              <button
                onClick={store.nextStep}
                className="bg-[#0071e3] text-white px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-[#0077ed] transition-all duration-200 active:scale-95"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="relative bg-[#0071e3] text-white px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-[#0077ed] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      AI 正在生成...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI 生成简历
                    </>
                  )}
                </span>
              </button>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 animate-pop-in">
              <svg className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-rose-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* 生成完成 Toast */}
      {toastVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-8 text-center shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.08)] animate-pop-in max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#e8f4fd] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">简历生成完成！</h3>
            <p className="text-sm text-[#86868b]">正在跳转到预览页面...</p>
          </div>
        </div>
      )}
    </div>
  )
}
