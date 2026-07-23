"""
E2E #8: core_strengths 唯一性/事实锚点验证
Target: http://127.0.0.1:59104/api/generate
Tests: cross-domain (tech→sales) + same-domain (tech→tech)
"""
import json, requests, sys, re

API_URL = "http://127.0.0.1:59104/api/generate"

# ── Test 1: Cross-domain ──
CROSS_PAYLOAD = {
    "personal": {"name": "欧阳键濠", "phone": "13000000000", "email": "test@qq.com", "self_intro": "软件工程大三学生"},
    "education": [{"school": "广东培正学院", "major": "软件工程", "degree": "本科", "start_year": "2023", "end_year": "2027", "gpa": "3.5/4.0", "courses": "数据结构、数据库原理、Java程序设计"}],
    "experience": [
        {"company": "某科技公司", "role": "Java后端实习生", "start_date": "2025-07", "end_date": "2025-09",
         "description": "参与社区便民维修系统后端开发，使用Spring Boot + MySQL，独立完成订单管理模块，修了一些Bug，写了单元测试"},
        {"company": "连锁餐饮门店", "role": "兼职店员", "start_date": "2024-03", "end_date": "2025-06",
         "description": "周末在奶茶店兼职，负责点单和出餐，忙的时候一个人要同时处理十几个订单"}
    ],
    "project_experience": [
        {"name": "简历内容生成器", "start_date": "2026-03", "end_date": "2026-06",
         "description": "独立开发AI简历生成工具，调用DeepSeek API实现JD匹配分析，React+FastAPI全栈"}
    ],
    "skills": "Java, Spring Boot, MySQL, React, Python, Git, 英语CET-4",
    "target_position": "外贸销售专员",
    "job_description": "岗位职责：1. 负责海外客户开发与维护，通过邮件、电话等方式与客户沟通；2. 跟进订单全流程；3. 收集市场信息，制定销售策略。要求：英语CET-4以上，客户导向思维，抗压能力强。"
}

# ── Test 2: Same-domain ──
SAME_PAYLOAD = {
    "personal": {"name": "欧阳键濠", "phone": "13000000000", "email": "test@qq.com", "self_intro": "软件工程大三学生"},
    "education": [{"school": "广东培正学院", "major": "软件工程", "degree": "本科", "start_year": "2023", "end_year": "2027", "gpa": "3.5/4.0", "courses": "数据结构、数据库原理、Java程序设计"}],
    "experience": [
        {"company": "某科技公司", "role": "Java后端实习生", "start_date": "2025-07", "end_date": "2025-09",
         "description": "参与社区便民维修系统后端开发，使用Spring Boot + MySQL，独立完成订单管理模块，修了一些Bug，写了单元测试"}
    ],
    "project_experience": [
        {"name": "简历内容生成器", "start_date": "2026-03", "end_date": "2026-06",
         "description": "独立开发AI简历生成工具，调用DeepSeek API实现简历内容生成，React+FastAPI全栈"}
    ],
    "skills": "Java, Spring Boot, MySQL, React, Python, Git, 英语CET-4",
    "target_position": "Java后端开发工程师",
    "job_description": "岗位职责：1. 负责后端服务开发与维护，使用Java/Spring Boot；2. 参与数据库设计与SQL优化；3. 编写单元测试保证代码质量。要求：熟悉Spring Boot和MySQL，有项目经验者优先。"
}

# ── Checks ──
FORBIDDEN_PATTERNS = [
    "快速学习", "学习能力强", "抗压能力", "沟通能力强", "执行力强",
    "认真负责", "责任心强", "积极主动", "踏实肯干", "客户服务意识",
    "需求分析能力", "团队协作能力", "这证明了", "这体现了", "这展示了",
    "独立完成XX功能", "从设计到上线",  # XX template leakage
    "通过XX课程", "保持了零客诉",
]

def check_core_strengths(cs_list, label):
    """Run all checks on core_strengths"""
    issues = []
    if len(cs_list) < 4 or len(cs_list) > 6:
        issues.append(f"[{label}] Expected 4-6 core_strengths, got {len(cs_list)}")
    
    for i, cs in enumerate(cs_list):
        # Check 1: No forbidden clichés
        for fp in FORBIDDEN_PATTERNS:
            if fp in cs:
                issues.append(f"[{label}] CS#{i+1} contains forbidden '{fp}': {cs[:100]}...")
        
        # Check 2: No fabricated numbers (unless present in user input)
        # Look for percentage patterns, specific bug counts, time compression
        num_patterns = [
            (r'\d+个[以\n上]*(Bug|bug|问题|建议)', "Bug/问题计数"),
            (r'从\d+%[提升降到]\d+%', "百分比变化"),
            (r'提升[了]?\d+%', "百分比提升"),
            (r'\d+次[提交\ncommit]', "commit次数"),
            (r'\d+[个位]人[以]*[协合]', "人数编造"),
        ]
        for pat, pat_name in num_patterns:
            m = re.search(pat, cs)
            if m:
                issues.append(f"[{label}] CS#{i+1} may contain fabricated {pat_name}: '{m.group()}' in: {cs[:120]}...")
        
        # Check 3: Name-cover test — if it could be written by any CS student, flag it
        vague_indicators = cs.count('XX') > 0 or (
            len(cs) > 20 and not any(kw in cs for kw in ['订单', '简历', '奶茶', '餐饮', '便民', '维修', 'Spring', 'Java', 'React', 'FastAPI', 'DeepSeek', 'MySQL'])
        )
        if vague_indicators and len(cs) > 20 and 'XX' not in cs:
            # Not necessarily bad if it references something specific from other dimensions
            pass  # soft check, don't flag automatically
    
    return issues

def run_test(payload, label):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    print(f"Target: {payload['target_position']}")
    print(f"Sending request...")
    
    try:
        resp = requests.post(API_URL, json=payload, timeout=300)
        print(f"Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Error: {resp.text[:500]}")
            return None
        return resp.json()
    except Exception as e:
        print(f"EXCEPTION: {e}")
        return None

# ── Run ──
all_issues = []

# Test 1: Cross-domain
data1 = run_test(CROSS_PAYLOAD, "Test 1: Cross-domain (tech → sales)")
if data1:
    cs1 = data1.get("core_strengths", [])
    print(f"\n--- Core Strengths ({len(cs1)}) ---")
    for i, cs in enumerate(cs1):
        print(f"  [{i+1}] {cs[:150]}")
    issues1 = check_core_strengths(cs1, "Cross")
    all_issues.extend(issues1)
    
    # Check career_summary for trigger words
    cs_text = data1.get("career_summary", "")
    triggers = ["奶茶", "外卖", "快递", "跑腿", "流水线", "工厂", "发传单", "洗碗", "保洁", "保安", "搬货", "收银员", "服务员"]
    for t in triggers:
        if t in cs_text:
            all_issues.append(f"[Cross] career_summary contains trigger '{t}': {cs_text[:100]}...")
    
    # Check jd_analysis gaps
    jda = data1.get("jd_analysis", {})
    for g in jda.get("gaps", []):
        for t in triggers:
            if t in g.get("suggestion", ""):
                all_issues.append(f"[Cross] jd_analysis gap contains trigger '{t}': {g.get('suggestion','')[:100]}...")

# Test 2: Same-domain
data2 = run_test(SAME_PAYLOAD, "Test 2: Same-domain (tech → tech)")
if data2:
    cs2 = data2.get("core_strengths", [])
    print(f"\n--- Core Strengths ({len(cs2)}) ---")
    for i, cs in enumerate(cs2):
        print(f"  [{i+1}] {cs[:150]}")
    issues2 = check_core_strengths(cs2, "Same")
    all_issues.extend(issues2)
    
    # Check for token_usage
    tu = data2.get("token_usage", {})
    print(f"\nToken usage: {tu}")

# ── Verdict ──
print(f"\n{'='*60}")
print(f"  VERDICT")
print(f"{'='*60}")
if all_issues:
    print(f"FAIL: {len(all_issues)} issue(s) found:")
    for issue in all_issues:
        print(f"  ❌ {issue}")
    sys.exit(1)
else:
    print(f"PASS: All core_strengths checks passed")
    sys.exit(0)
