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

    // ===== 分步表单 =====
    currentStep: 1,
    nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 5) })),
    prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

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
    setEducation: (education) => set({ education }),
    addEducation: () => set((s) => ({
      education: [...s.education, {
        school: '', major: '', degree: '',
        startYear: '', endYear: '', gpa: '', courses: ''
      }]
    })),
    removeEducation: (index) => set((s) => ({
      education: s.education.filter((_, i) => i !== index)
    })),

    // ===== 第 4 步：工作经历 =====
    workExperience: [],
    setWorkExperience: (workExperience) => set({ workExperience }),
    addWorkExperience: () => set((s) => ({
      workExperience: [...s.workExperience, {
        company: '', role: '', startDate: '', endDate: '', description: ''
      }]
    })),
    removeWorkExperience: (index) => set((s) => ({
      workExperience: s.workExperience.filter((_, i) => i !== index)
    })),

    // ===== 第 4 步：项目经历 =====
    projectExperience: [],
    setProjectExperience: (projectExperience) => set({ projectExperience }),
    addProjectExperience: () => set((s) => ({
      projectExperience: [...s.projectExperience, {
        name: '', startDate: '', endDate: '', description: ''
      }]
    })),
    removeProjectExperience: (index) => set((s) => ({
      projectExperience: s.projectExperience.filter((_, i) => i !== index)
    })),

    // ===== 第 5 步：技能证书 =====
    skills: '',
    setSkills: (skills) => set({ skills }),

    // ===== AI 生成结果 =====
    generatedResume: null,
    setGeneratedResume: (generatedResume) => set({ generatedResume }),

    // ===== 项目分析结果（面试准备） =====
    interviewPrep: null,
    setInterviewPrep: (interviewPrep) => set({ interviewPrep }),

    // ===== 构建请求数据（给后端 API 用） =====
    buildRequestData: () => {
      const s = get()
      return {
        personal: {
          name: s.personal.name,
          phone: s.personal.phone,
          email: s.personal.email,
          self_intro: s.personal.selfIntro,
        },
        education: s.education.map(e => ({
          school: e.school,
          major: e.major,
          degree: e.degree,
          start_year: e.startYear,
          end_year: e.endYear,
          gpa: e.gpa,
          courses: e.courses,
        })),
        experience: s.workExperience.map(e => ({
          company: e.company,
          role: e.role,
          start_date: e.startDate,
          end_date: e.endDate,
          description: e.description,
        })),
        project_experience: s.projectExperience.map(e => ({
          name: e.name,
          start_date: e.startDate,
          end_date: e.endDate,
          description: e.description,
        })),
        skills: s.skills,
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
    }),
  }),
    { name: 'resume-storage', version: 1 }
  )
)

export default useResumeStore
