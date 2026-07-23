import { useNavigate } from 'react-router-dom'

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

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-surface">
      {/* Hero */}
      <div className="pt-24 pb-12 px-4 text-center max-w-2xl mx-auto animate-fade-in-up">
        <h1 className="text-4xl font-bold text-slate-800 mb-3">
          AI 简历生成器
        </h1>
        <p className="text-lg text-slate-600 mb-6">
          5 分钟搞定一份能投出去的简历
        </p>
        <button
          onClick={() => navigate('/form')}
          className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium
                     hover:bg-primary-700 hover:scale-105 transition-all duration-200
                     shadow-card hover:shadow-card-hover"
        >
          开始制作简历
        </button>
      </div>

      {/* 适用场景 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-sm text-gray-400 mb-6">无论你处于哪个阶段，都能用得上</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PERSONAS.map((p) => (
            <div
              key={p.title}
              className="bg-white rounded-lg p-5 shadow-card transition-shadow duration-200
                         hover:shadow-card-hover"
            >
              <h3 className="font-semibold text-slate-800 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 三步流程 */}
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-sm text-gray-400 mb-8">三步完成一份简历</p>
        <div className="flex items-center justify-center gap-0">
          {['填写信息', 'AI 润色', '复制使用'].flatMap((label, i) => {
            const step = (
              <div key={`step-${i}`} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full border-2 border-primary-200 flex items-center justify-center
                                text-primary-600 font-semibold text-sm">
                  {i + 1}
                </div>
                <span className="text-xs text-gray-500 mt-2">{label}</span>
              </div>
            )
            if (i === 2) return [step]
            return [
              step,
              <span key={`arrow-${i}`} className="text-gray-300 mx-4 mb-5">&rarr;</span>,
            ]
          })}
        </div>
      </div>
    </div>
  )
}
