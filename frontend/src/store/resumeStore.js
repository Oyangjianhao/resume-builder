/**
 * 简历状态管理（Zustand Store）
 *
 * 管理整个简历流程：填写 → AI 生成 → 预览 → 导出
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useResumeStore = create(
  persist(
    (set, get) => ({

    // ===== 会话标记：逐类别追踪用户是否在当前会话中编辑过 =====
    // 不持久化——每次页面加载全部重置为 false
    _editedEducation: false,
    _editedExperience: false,
    _editedProjects: false,
    _editedSkills: false,

    // ===== 分步表单 =====
    currentStep: 1,
    nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 5) })),
    prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
    setCurrentStep: (step) => set({ currentStep: Math.max(1, Math.min(5, step)) }),

    // ===== 第 1 步：基本信息 =====
    personal: {
      name: '',
      phone: '',
      email: '',
      selfIntro: '',
    },
    setPersonal: (personal) => set({ personal }),

    // ===== 第 2 步：目标岗位 =====
    targetPosition: '',
    setTargetPosition: (targetPosition) => set({ targetPosition }),
    jobDescription: '',
    setJobDescription: (jobDescription) => set({ jobDescription }),

    // ===== 第 3 步：教育经历 =====
    education: [],
    setEducation: (education) => set({ education, _editedEducation: true }),
    addEducation: () => set((s) => ({
      education: [...s.education, {
        school: '', major: '', degree: '',
        startYear: '', endYear: '', gpa: '', courses: ''
      }],
      _editedEducation: true
    })),
    removeEducation: (index) => set((s) => ({
      education: s.education.filter((_, i) => i !== index),
      _editedEducation: true
    })),

    // ===== 第 4 步：工作经历 =====
    workExperience: [],
    setWorkExperience: (workExperience) => set({ workExperience, _editedExperience: true }),
    addWorkExperience: () => set((s) => ({
      workExperience: [...s.workExperience, {
        company: '', role: '', startDate: '', endDate: '', description: ''
      }],
      _editedExperience: true
    })),
    removeWorkExperience: (index) => set((s) => ({
      workExperience: s.workExperience.filter((_, i) => i !== index),
      _editedExperience: true
    })),

    // ===== 第 4 步：项目经历 =====
    projectExperience: [],
    setProjectExperience: (projectExperience) => set({ projectExperience, _editedProjects: true }),
    addProjectExperience: () => set((s) => ({
      projectExperience: [...s.projectExperience, {
        name: '', startDate: '', endDate: '', description: ''
      }],
      _editedProjects: true
    })),
    removeProjectExperience: (index) => set((s) => ({
      projectExperience: s.projectExperience.filter((_, i) => i !== index),
      _editedProjects: true
    })),

    // ===== 第 5 步：技能证书 =====
    skills: '',
    setSkills: (skills) => set({ skills, _editedSkills: true }),

    // ===== AI 生成结果 =====
    generatedResume: null,
    setGeneratedResume: (generatedResume) => set({ generatedResume }),

    // ===== 项目分析结果（面试准备） =====
    interviewPrep: null,
    setInterviewPrep: (interviewPrep) => set({ interviewPrep }),

    // ===== 判断当前数据是否为实质空输入（仅含基本信息骨架） =====
    isEffectivelyEmpty: () => {
      const s = get()
      const hasRealEducation = s.education.some(e =>
        e.school || e.major || e.degree
      )
      const hasRealWork = s.workExperience.some(e =>
        e.company || e.role || e.description
      )
      const hasRealProject = s.projectExperience.some(e =>
        e.name || e.description
      )
      return !hasRealEducation && !hasRealWork && !hasRealProject && !s.skills.trim()
    },

    // ===== 构建请求数据（给后端 API 用） =====
    buildRequestData: () => {
      const s = get()

      // 核心修复：逐类别检测——用户没编辑过的类别，数据来自 localStorage 旧缓存，丢弃
      return {
        personal: {
          name: s.personal.name,
          phone: s.personal.phone,
          email: s.personal.email,
          self_intro: s.personal.selfIntro,
        },
        education: s._editedEducation
          ? s.education.map(e => ({
              school: e.school, major: e.major, degree: e.degree,
              start_year: e.startYear, end_year: e.endYear,
              gpa: e.gpa, courses: e.courses,
            }))
          : [],
        experience: s._editedExperience
          ? s.workExperience.map(e => ({
              company: e.company, role: e.role,
              start_date: e.startDate, end_date: e.endDate,
              description: e.description,
            }))
          : [],
        project_experience: s._editedProjects
          ? s.projectExperience.map(e => ({
              name: e.name,
              start_date: e.startDate, end_date: e.endDate,
              description: e.description,
            }))
          : [],
        skills: s._editedSkills ? s.skills : '',
        target_position: s.targetPosition,
        job_description: s.jobDescription,
      }
    },

    // ===== 重置 =====
    reset: () => set({
      currentStep: 1,
      personal: { name: '', phone: '', email: '', selfIntro: '' },
      targetPosition: '',
      jobDescription: '',
      education: [],
      workExperience: [],
      projectExperience: [],
      skills: '',
      generatedResume: null,
      interviewPrep: null,
      _editedEducation: false,
      _editedExperience: false,
      _editedProjects: false,
      _editedSkills: false,
    }),
  }),
    {
      name: 'resume-storage',
      version: 3,
      // 不持久化 _edited* 标记——每次页面加载都重置为 false
      partialize: (state) => {
        const {
          _editedEducation, _editedExperience,
          _editedProjects, _editedSkills, ...persistable
        } = state
        return persistable
      },
    }
  )
)

export default useResumeStore
