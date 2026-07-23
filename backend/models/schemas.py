from pydantic import BaseModel, Field


# ===== 请求模型：前端提交的用户信息 =====

class Education(BaseModel):
    school: str = Field(description="学校名称，例如：广东培正学院")
    major: str = Field(description="专业名称，例如：软件工程")
    degree: str = Field(description="学历层次：本科 / 硕士 / 博士")
    start_year: str = Field(description="入学年份，例如：2023")
    end_year: str = Field(description="毕业年份，例如：2027")
    gpa: str = Field(default="", description="GPA 成绩（选填），例如：3.5/4.0")
    courses: str = Field(default="", description="相关课程（选填），例如：数据结构、数据库原理")


class Experience(BaseModel):
    company: str = Field(description="公司名称")
    role: str = Field(description="担任的职位，例如：Java后端实习生")
    start_date: str = Field(description="开始时间，例如：2025-07")
    end_date: str = Field(description="结束时间，例如：2025-09")
    description: str = Field(description="工作描述（随意写，AI 会自动润色成专业语言）")


class ProjectExperience(BaseModel):
    name: str = Field(description="项目名称")
    start_date: str = Field(description="开始时间，例如：2025-07")
    end_date: str = Field(description="结束时间，例如：2025-09")
    description: str = Field(description="项目描述（随意写，AI 会自动润色成专业语言）")


class UserInfo(BaseModel):
    name: str = Field(description="姓名")
    phone: str = Field(description="手机号码")
    email: str = Field(description="邮箱地址")
    self_intro: str = Field(default="", description="简短自我介绍（选填）")


class ResumeRequest(BaseModel):
    """前端提交的完整简历数据，包含个人信息、教育经历、工作经历、技能和目标岗位"""
    personal: UserInfo = Field(description="个人基本信息")
    education: list[Education] = Field(default=[], description="教育经历列表（可以有多段学历）")
    experience: list[Experience] = Field(default=[], description="工作经历列表")
    project_experience: list[ProjectExperience] = Field(default=[], description="项目经历列表")
    skills: str = Field(default="", description="技能与证书，例如：Java, MySQL, CET-4")
    target_position: str = Field(description="目标岗位，例如：Java后端开发工程师")
    job_description: str = Field(default="", description="目标岗位的招聘信息（选填），用于精准匹配")


# ===== 响应模型：AI 生成的结构化简历内容（v0.2） =====

class BulletPoint(BaseModel):
    """单条经历要点，附带 JD 匹配说明"""
    text: str = Field(description="STAR 格式的 bullet 内容")
    match_reason: str = Field(default="", description="该 bullet 回应了 JD 的哪个要求（如：对应JD中'Spring Boot框架经验'的要求）")
    match_score: str = Field(default="medium", description="匹配度：high / medium / low")


class SkillGroup(BaseModel):
    """分类技能组"""
    category: str = Field(description="技能类别，如：编程语言、框架/工具、数据库、语言能力")
    items: list[str] = Field(description="该类别下的具体技能")


class InterviewTip(BaseModel):
    """针对某段经历的面试话术"""
    experience_name: str = Field(description="对应的经历名称（公司名或项目名）")
    questions: list[dict] = Field(description="面试问题列表，每项含 question 和 answer_hint")


class PolishedExperience(BaseModel):
    type: str = Field(default="work", description="经历类型：work=工作经历，project=项目经历")
    company: str = Field(default="", description="公司名称（工作经历）")
    role: str = Field(default="", description="职位（工作经历）")
    name: str = Field(default="", description="项目名称（项目经历）")
    start_date: str = Field(description="开始时间")
    end_date: str = Field(description="结束时间")
    bullets: list[BulletPoint] = Field(default=[], description="AI 润色后的 STAR 格式要点（每条附 match_reason）")
    jd_match: list[str] = Field(default=[], description="该经历整体匹配的 JD 核心要求")


class ResumeResponse(BaseModel):
    """AI 润色后的完整简历内容（v0.2：面向复制粘贴，非排版导出）"""
    name: str = Field(description="姓名")
    phone: str = Field(description="手机号码")
    email: str = Field(description="邮箱地址")
    target_position: str = Field(description="目标岗位")
    # --- v0.2 新增板块 ---
    job_objective: str = Field(default="", description="求职意向（一行话，如：Java后端 · 广州 · 2周到岗）")
    career_summary: str = Field(default="", description="职业概述（1-2句话，第一句直击JD核心需求）")
    core_strengths: list[str] = Field(default=[], description="核心优势（6条供用户挑选）")
    self_evaluation: str = Field(default="", description="自我评价（3-4句话，根据JD软素质定制）")
    interview_tips: list[InterviewTip] = Field(default=[], description="面试话术（每段经历2-3个问题+回答思路）")
    # --- 经历 ---
    education: list[Education] = Field(description="教育经历（原样返回）")
    experience: list[PolishedExperience] = Field(default=[], description="AI 润色后的工作经历")
    project_experience: list[PolishedExperience] = Field(default=[], description="AI 润色后的项目经历")
    # --- 技能（v0.2 改为分类输出） ---
    skills: list[SkillGroup] = Field(default=[], description="按类别分组的技能清单")
    certificates: list[str] = Field(default=[], description="证书列表（事实性凭证原样列出）")
    # --- 分析与元数据 ---
    jd_analysis: dict = Field(default={}, description="JD 匹配分析：key_requirements, matched_projects, gaps")
    token_usage: dict = Field(default={}, description="AI 调用消耗的 token 数量")
    # --- 向后兼容（v0.1 遗留字段，逐步废弃） ---
    summary: str = Field(default="", description="【已废弃】旧版个人总结，v0.2 拆为 career_summary + core_strengths")


# ===== 项目深度分析模型 =====

class AnalysisRequest(BaseModel):
    """项目深度分析请求（文件 + 用户描述）"""
    description: str = Field(default="", description="用户对项目的简单描述")
    target_position: str = Field(default="", description="目标岗位，用于调整分析侧重点")


class LikelyQuestion(BaseModel):
    jd_requirement: str = Field(default="", description="对应的 JD 维度/要求")
    question: str = Field(description="可能被问到的面试问题")
    question_type: str = Field(default="", description="题型：技术原理/设计决策/问题排查/场景延伸")
    hint: str = Field(description="回答提示，结合项目实际场景")


class InterviewPrep(BaseModel):
    key_technologies: list[str] = Field(default=[], description="需要掌握的核心技术点")
    likely_questions: list[LikelyQuestion] = Field(default=[], description="可能被问到的面试问题")
    study_tips: str = Field(default="", description="学习建议")


class AnalysisResponse(BaseModel):
    """项目深度分析结果"""
    jd_dimensions: list[str] = Field(default=[], description="从 JD 中提取的核心维度（JD 模式下才有值）")
    jd_project_relevance: str = Field(default="", description="项目与 JD 的关联度：high/partial/low")
    relevance_reason: str = Field(default="", description="关联度判断理由")
    bullets: list[str] = Field(default=[], description="AI 分析后的 STAR 格式经历描述")
    tech_stack: list[str] = Field(default=[], description="AI 识别出的技术栈")
    role: str = Field(default="", description="AI 识别出的用户角色定位")
    interview_prep: InterviewPrep = Field(default_factory=InterviewPrep, description="面试准备清单")
    token_usage: dict = Field(default={}, description="AI 调用消耗的 token 数量")
