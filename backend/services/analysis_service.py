"""
项目深度分析服务
分层策略：全局理解 → 核心模块深入 → 综合生成
"""
import json

from config import DEEPSEEK_API_KEY, DEEPSEEK_API_URL, DEEPSEEK_MODEL
from models.schemas import AnalysisResponse, InterviewPrep, LikelyQuestion
from services.file_parser import filter_core_files

import requests


def analyze_project(parsed_files: dict, user_description: str, target_position: str = "", job_description: str = "") -> AnalysisResponse:
    """
    主入口：接收解析后的文件数据，执行分层分析

    parsed_files: file_parser.parse_uploaded_file() 的返回值
    user_description: 用户对项目的简单描述
    target_position: 目标岗位（可选）
    job_description: 目标岗位的招聘信息/JD（可选，用于精准匹配面试问题）
    """
    total_tokens = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}

    # === 第一层：全局理解 ===
    phase1_result, usage1 = _phase1_global_understanding(
        parsed_files["dir_structure"],
        parsed_files["files"],
        user_description,
    )
    _accumulate_tokens(total_tokens, usage1)

    # === 第二层：核心模块深入 ===
    core_files = filter_core_files(parsed_files.get("files", []), max_files=8)
    phase2_result, usage2 = _phase2_core_analysis(core_files, phase1_result)
    _accumulate_tokens(total_tokens, usage2)

    # === 第三层：综合生成（内部做两次 AI 调用，返回累计 token） ===
    final_result, phase3_tokens = _phase3_generate(
        phase1_result, phase2_result, user_description, target_position, job_description
    )
    total_tokens["input_tokens"] += phase3_tokens.get("input_tokens", 0)
    total_tokens["output_tokens"] += phase3_tokens.get("output_tokens", 0)
    total_tokens["total_tokens"] += phase3_tokens.get("total_tokens", 0)

    # 组装响应
    return AnalysisResponse(
        jd_dimensions=final_result.get("jd_dimensions", []),
        jd_project_relevance=final_result.get("jd_project_relevance", ""),
        relevance_reason=final_result.get("relevance_reason", ""),
        bullets=final_result.get("bullets", []),
        tech_stack=final_result.get("tech_stack", []),
        role=final_result.get("role", ""),
        interview_prep=InterviewPrep(
            key_technologies=final_result.get("interview_prep", {}).get("key_technologies", []),
            likely_questions=[
                LikelyQuestion(**q) for q in final_result.get("interview_prep", {}).get("likely_questions", [])
            ],
            study_tips=final_result.get("interview_prep", {}).get("study_tips", ""),
        ),
        token_usage=total_tokens,
    )


def _phase1_global_understanding(dir_structure: str, files: list[dict], user_description: str) -> tuple:
    """第一层：让 AI 理解项目整体架构"""
    # 找到 README 和依赖文件
    readme_content = ""
    deps_content = ""
    for f in files:
        name = f["path"].split("/")[-1].split("\\")[-1]
        if name.lower().startswith("readme"):
            readme_content = f["content"][:5000]
        if name in ("pom.xml", "package.json", "requirements.txt", "Pipfile", "build.gradle"):
            deps_content += f"--- {name} ---\n{f['content'][:3000]}\n\n"

    prompt = f"""你是一个技术项目分析专家。请分析以下项目的整体结构和技术栈。

## 目录结构
{dir_structure[:8000]}

## README 内容
{readme_content or "（无 README）"}

## 依赖配置
{deps_content or "（无依赖文件）"}

## 用户描述
{user_description or "（无描述）"}

请返回 JSON 格式的分析结果：
{{
  "project_type": "项目类型（如：Web应用、移动端、微服务等）",
  "main_tech_stack": ["主要技术1", "主要技术2"],
  "architecture": "架构描述（1-2句话）",
  "key_features": ["核心功能1", "核心功能2", "核心功能3"]
}}

只返回 JSON，不要其他文字。"""

    result = _call_deepseek(prompt)
    content = result["choices"][0]["message"]["content"]
    usage = result.get("usage", {})

    return _safe_parse_json(content), usage


def _phase2_core_analysis(core_files: list[dict], phase1_result: dict) -> tuple:
    """第二层：深入分析核心模块代码"""
    if not core_files:
        return {"analysis": "无核心文件可分析"}, {}

    # 拼接核心文件内容
    files_text = ""
    for f in core_files:
        files_text += f"\n--- {f['path']} ---\n{f['content'][:8000]}\n"

    prompt = f"""你是一个技术项目分析专家。以下是项目的核心代码文件，项目概况如下：
{json.dumps(phase1_result, ensure_ascii=False, indent=2)}

## 核心代码文件
{files_text}

请深入分析这些代码，返回 JSON 格式：
{{
  "modules": [
    {{
      "name": "模块名",
      "description": "模块功能描述",
      "tech_used": ["使用的技术"],
      "design_patterns": "使用的设计模式或架构模式（如有）",
      "highlights": "技术亮点或值得注意的实现"
    }}
  ],
  "overall_quality": "代码质量简评（1-2句）",
  "additional_tech": ["在代码中发现的额外技术/框架"]
}}

只返回 JSON，不要其他文字。"""

    result = _call_deepseek(prompt)
    content = result["choices"][0]["message"]["content"]
    usage = result.get("usage", {})

    return _safe_parse_json(content), usage


def _phase3_generate(phase1: dict, phase2: dict, user_description: str, target_position: str, job_description: str = "") -> tuple:
    """第三层：综合前两层分析，生成简历描述 + 面试准备清单（分两次 AI 调用）"""
    has_jd = bool(job_description.strip())
    total_tokens = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}

    # ============================================================
    # 第一次调用：生成简历 bullets + 关联度评估 + 技术栈
    # ============================================================
    if has_jd:
        jd_block = f"""
===== 目标岗位招聘信息（JD） =====
{job_description}"""

        bullet_instruction = """## bullets 生成规则（JD 驱动）

先仔细阅读 JD，提取 4-6 个核心维度（每个维度是 JD 中明确出现的硬性要求或高频关键词）。

对项目的每个技术亮点/功能模块，从三个维度找与 JD 的重合：
- 技术栈重合：JD 要求的技术，项目里用到了哪些？重点展开
- 能力维度重合：JD 要"独立解决问题"→ 突出项目中独立攻克难关的过程
- 业务场景相似：JD 提到"高并发"→ 强调项目中的规模和性能数据

选择叙事角度：同一个项目功能，从最贴合 JD 的角度写。
每条 bullet：
- 以 JD 关心的维度开头（"针对XX需求，设计/实现了..."）
- JD 提到的技术/工具，项目里用到的必须显式出现
- 用数据量化成果
- 禁止泛泛描述"""

        format_block_a = """返回 JSON 格式：
{
  "jd_dimensions": ["维度名称（JD原文摘录：'...'）"],
  "jd_project_relevance": "high/partial/low",
  "relevance_reason": "一句话说明为什么判断为这个关联度",
  "bullets": ["针对JD的XX需求，在项目中设计/实现了...(行动)，达到...(结果)"],
  "tech_stack": ["JD相关技术1", "JD相关技术2"],
  "role": "用户在项目中的角色定位",
  "project_brief": "用一句非技术语言概括这个项目是做什么的（如：一个社区维修报修管理平台）"
}"""

        prompt_a = f"""你是一个资深简历顾问。请根据以下项目分析结果和目标岗位 JD，生成简历经历描述。

## 项目整体分析
{json.dumps(phase1, ensure_ascii=False, indent=2)}

## 核心模块分析
{json.dumps(phase2, ensure_ascii=False, indent=2)}

## 用户描述
{user_description or "（无描述）"}

{jd_block}

{bullet_instruction}

## 关联度评估
判断项目与 JD 的关联度：
- "high"：项目技术栈/工作内容与 JD 要求高度重合
- "partial"：部分重叠（同行业不同岗、有交集技能）
- "low"：几乎无重叠（跨行业跨职能，如技术项目+销售岗）

## 其他要求
- 不要编造用户没有做过的事
- 只返回 JSON，不要其他文字

{format_block_a}"""

    else:
        prompt_a = f"""你是一个资深简历顾问。请根据以下项目分析结果，生成简历经历描述。

## 项目整体分析
{json.dumps(phase1, ensure_ascii=False, indent=2)}

## 核心模块分析
{json.dumps(phase2, ensure_ascii=False, indent=2)}

## 用户描述
{user_description or "（无描述）"}

目标岗位：{target_position or "（未指定）"}

## bullets 生成规则
- 每条用 STAR 法则
- 突出与目标岗位相关的能力和成果
- 用数据量化成果
- 3-5 条

只返回 JSON：
{{
  "bullets": ["STAR 格式的经历要点1"],
  "tech_stack": ["技术1", "技术2"],
  "role": "用户在项目中的角色定位",
  "project_brief": "一句话概括项目"
}}"""

    result_a = _call_deepseek(prompt_a, has_jd=has_jd)
    content_a = result_a["choices"][0]["message"]["content"]
    usage_a = result_a.get("usage", {})
    _accumulate_tokens(total_tokens, usage_a)
    main_result = _safe_parse_json(content_a)

    # ============================================================
    # 第二次调用：单独生成面试准备（不传入项目技术细节）
    # ============================================================
    relevance = main_result.get("jd_project_relevance", "high") if has_jd else ""
    project_brief = main_result.get("project_brief", user_description or "")

    interview_result, usage_b = _generate_interview_prep(
        job_description=job_description if has_jd else "",
        target_position=target_position,
        project_brief=project_brief,
        user_description=user_description,
        relevance=relevance,
        has_jd=has_jd,
    )
    _accumulate_tokens(total_tokens, usage_b)

    main_result["interview_prep"] = interview_result.get("interview_prep", {})

    return main_result, total_tokens


def _generate_interview_prep(job_description, target_position, project_brief, user_description, relevance, has_jd):
    """单独生成面试准备清单——不传入项目技术细节，只给面试官视角的信息"""

    if has_jd:
        if relevance == "low":
            strategy = """## 出题策略（跨行跨岗模式）

你是一个目标岗位的面试官。你不懂技术，也不关心候选人做过什么项目的技术细节。
你只关心：这个人能不能干这个岗位的活？

你必须围绕以下维度出题（每个维度至少 1 题）：

1. 转行动机：为什么放弃原来的专业方向？为什么选择这个岗位？你对这个岗位的日常工作内容了解多少？
2. 可迁移能力：候选人之前做过一个项目（不用关心技术细节），从这段经历中能体现什么通用能力？
   - 例如：项目有deadline → "你怎么管理项目进度？遇到延期怎么办？"
   - 例如：项目有团队协作 → "你怎么跟不同背景的人协作？遇到意见不合怎么处理？"
   - 例如：项目需要理解用户需求 → "你怎么了解客户需求？怎么确保交付符合客户期望？"
3. 岗位核心能力：直接用目标岗位的真实工作场景出题。
   - 仔细阅读 JD，提取具体的工作场景和职责描述来出题。
   - 【重要】如果 JD 信息很简略（只有岗位名称没有详细职责描述），不要只依赖 JD 文本，
     而是基于你对该岗位的行业常识，自主补充最典型、最高频的工作场景，
     确保每道场景题都有画面感（像真实面试官会问的，而非泛泛而谈）。
     常见跨行目标岗位的典型工作场景参考（仅在 JD 信息不足时调用）：
     * 外贸销售/外贸业务员：展会获客与跟进、B2B平台（阿里国际站等）开发客户、
       客户询盘处理与报价技巧、价格谈判与合同条款、订单跟进与出货流程、
       客户维护与二次开发、竞品分析与市场调研
     * 销售/BD：客户开发与渠道建设、销售漏斗管理与跟进节奏、
       客情关系维护与客户异议处理、商务谈判与合同、业绩目标拆解
     * 运营/市场：活动策划与执行、数据分析与复盘优化、
       用户增长与留存策略、内容与渠道运营、跨部门资源协调
     * 其他岗位：根据岗位名称推断核心工作场景，确保至少覆盖 3-4 个具体方向
   - 例如销售岗："你怎么开发一个新客户？""客户说价格太贵你怎么应对？""你怎么做竞品分析？"
   - 例如运营岗："你怎么策划一次线上活动？""数据不达预期你怎么调整策略？"
4. 行业认知：你对目标行业了解多少？行业趋势？主要竞争对手？目标客户是谁？
5. 语言/沟通：如 JD 要求英语，必须出 1-2 道英语场景题（如 "How would you introduce our product to an overseas client?"）
6. 快速学习：你打算怎么补足跨领域的知识短板？有什么具体的学习计划？

【绝对禁止】
- 不要问任何技术实现问题（不要问 Spring Boot、MySQL、代码、框架、数据库设计等）
- 不要在问题中提到具体的技术名词
- 不要问"你项目中用了什么技术栈"这类问题
- 你的身份是目标岗位的面试官，不是技术面试官"""

            key_tech_instruction = """## key_abilities（这里指"关键能力"而非技术）
列出目标岗位需要的核心能力/知识领域（不是技术框架），标注：
- 哪些可以从项目经验中迁移（如：项目管理能力、需求分析能力、团队协作）
- 哪些需要从零学习（如：行业知识、专业技能、语言能力）
输出格式仍然用 key_technologies 字段名，但内容是能力/知识，不是技术框架。"""

        elif relevance == "partial":
            strategy = """## 出题策略（部分关联模式）

候选人有一定的相关背景但不完全匹配。面试会混合考察可迁移能力和岗位专业能力。

出题比例：40% 可迁移能力 + 60% 目标岗位能力

题型：
1. 可迁移能力（2-3题）：从候选人的项目经验中提炼与目标岗位相关的通用能力
2. 岗位核心能力（3-4题）：按 JD 的真实工作场景出题
3. 角色转换（1题）："你觉得从XX转YY，你最大的优势和劣势是什么？"
4. 行业/专业知识（1题）

【注意】
- 可迁移能力题可以提及候选人做过项目，但不要问技术实现细节
- 问的是"这段经历锻炼了你的什么能力"，而不是"你项目里用了什么技术" """

            key_tech_instruction = """## key_technologies
列出可迁移的技能 + 目标岗位需要学习的新技能，每项标注来源（项目迁移/需新学）"""

        else:  # high
            strategy = """## 出题策略（技术对口模式）

候选人的项目与目标岗位高度相关。面试会围绕项目技术实现深入考察。

题型（每种至少 1 题）：
1. 技术原理：项目中某个技术点怎么实现的？为什么选这个方案？
2. 设计决策：为什么这样设计？对比过其他方案吗？
3. 问题排查：遇到过什么技术难题？排查过程？
4. 场景延伸：按 JD 描述的业务规模，当前设计哪里需要优化？

注意：候选人项目的简要信息是：{project_brief}
你可以围绕这个项目出题，但每个问题必须具体到可操作的技术细节。"""

            key_tech_instruction = """## key_technologies
列出 JD 要求且项目中用到的技术，每个技术结合项目场景说明。
JD 要求但项目没涉及的，标注"建议补充学习"。"""

        prompt_b = f"""你是一个{"" if relevance == "high" else "非技术背景的"}面试官，正在招聘以下岗位。请根据 JD 出面试题目。

===== 目标岗位招聘信息（JD） =====
{job_description}

===== 候选人背景 =====
- 做过一个项目：{project_brief}
- 用户自述：{user_description or "（无）"}
- 项目与岗位关联度：{relevance}

{strategy}

{key_tech_instruction}

## likely_questions 规则
- 至少 6 个问题
- 每个问题附带 jd_requirement（对应 JD 的哪条要求）和 question_type（题型分类）
- 问题要具体、有场景感，不要泛泛而谈

## study_tips 规则
- 针对目标岗位给出学习路径建议
- 指出候选人当前最大的知识/能力缺口
- 推荐具体的学习方向

只返回 JSON，不要其他文字：
{{
  "interview_prep": {{
    "key_technologies": ["能力/技术点 — 与目标岗位的关系"],
    "likely_questions": [
      {{
        "jd_requirement": "对应的 JD 要求",
        "question": "面试官会问的问题",
        "question_type": "题型分类",
        "hint": "回答思路"
      }}
    ],
    "study_tips": "学习路径建议"
  }}
}}"""

    else:
        prompt_b = f"""你是一个面试官。候选人做过以下项目，目标岗位是{target_position or "（未指定）"}。
请生成面试准备清单。

项目：{project_brief}
用户描述：{user_description or "（无）"}

请生成：
- key_technologies：3-6 个项目相关的核心技术点（结合使用场景）
- likely_questions：至少 5 个面试问题（技术原理、设计决策、问题排查各至少 1 个）
- study_tips：整体学习建议

只返回 JSON：
{{
  "interview_prep": {{
    "key_technologies": ["技术点1（场景）"],
    "likely_questions": [
      {{ "question": "问题", "hint": "回答建议" }}
    ],
    "study_tips": "建议"
  }}
}}"""

    result = _call_deepseek(prompt_b, has_jd=has_jd)
    content = result["choices"][0]["message"]["content"]
    usage = result.get("usage", {})

    return _safe_parse_json(content), usage


def _call_deepseek(prompt: str, has_jd: bool = False) -> dict:
    """调用 DeepSeek API"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
    }

    if has_jd:
        system_msg = (
            "你是一个专业的技术项目分析助手和简历顾问，同时具备招聘方视角。"
            "你必须严格按照用户要求的JSON格式返回结果，不要包含任何额外文字。"
            "核心原则：所有输出（面试问题/技术要点/bullets）都必须围绕目标岗位JD的要求展开。"
        )
    else:
        system_msg = (
            "你是一个专业的技术项目分析助手和简历顾问。"
            "你必须严格按照用户要求的JSON格式返回结果，不要包含任何额外文字。"
        )

    data = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.5 if has_jd else 0.3,
        "max_tokens": 5000 if has_jd else 3000
    }

    response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data, timeout=120)
    response.raise_for_status()
    return response.json()


def _safe_parse_json(text: str) -> dict:
    """安全解析 JSON，处理 AI 可能返回的格式问题"""
    text = text.strip()

    if "```json" in text:
        start = text.index("```json") + 7
        end = text.index("```", start)
        text = text[start:end].strip()
    elif "```" in text:
        start = text.index("```") + 3
        end = text.index("```", start)
        text = text[start:end].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"error": "AI 返回格式异常", "raw": text[:500]}


def _accumulate_tokens(total: dict, usage: dict):
    """累计 token 使用量"""
    total["input_tokens"] += usage.get("prompt_tokens", 0)
    total["output_tokens"] += usage.get("completion_tokens", 0)
    total["total_tokens"] += usage.get("total_tokens", 0)
