"""
E2E test for #11 (academic background) and #12 (record-keeping / student leader).
Target: http://127.0.0.1:59104/api/generate
"""
import sys, json, requests, re

API_URL = "http://127.0.0.1:59104/api/generate"

# Cross-domain payload with 心理委员 experience
PAYLOAD = {
    "personal": {
        "name": "欧阳键濠",
        "phone": "13900000000",
        "email": "test@qq.com",
        "self_intro": "软件工程大三学生，担任过班级心理委员，有连锁餐饮门店兼职经验"
    },
    "education": [{
        "school": "广东培正学院",
        "major": "软件工程",
        "degree": "本科",
        "start_year": "2023",
        "end_year": "2027",
        "gpa": "3.5/4.0",
        "courses": "数据结构、数据库原理、Java程序设计"
    }],
    "experience": [
        {
            "company": "某科技公司",
            "role": "Java后端实习生",
            "start_date": "2025-07",
            "end_date": "2025-09",
            "description": "参与社区便民维修系统后端开发，使用Spring Boot+MySQL，独立完成订单管理模块，写单元测试覆盖核心逻辑"
        },
        {
            "company": "连锁餐饮门店",
            "role": "兼职店员",
            "start_date": "2024-03",
            "end_date": "2025-06",
            "description": "在奶茶店周末兼职，忙的时候一个人同时处理十几个订单，高峰期能保持出餐速度，还被店长安排带过新来的兼职"
        }
    ],
    "campus_experience": [
        {
            "role": "班级心理委员",
            "start_date": "2024-09",
            "end_date": "2025-06",
            "description": "担任班级心理委员，学校要求定期关注同学心理状态并做记录。我用Excel建了一个简单的记录表，每次和同学聊完后记录日期、主要话题和后续需要关注的点，方便下次跟进。一年下来累积了40多条记录，辅导员说我的记录做得最规范。"
        }
    ],
    "project_experience": [
        {
            "name": "简历内容生成器",
            "start_date": "2026-03",
            "end_date": "2026-06",
            "description": "独立开发AI简历生成工具，调用DeepSeek API实现JD匹配分析，React+FastAPI全栈"
        }
    ],
    "skills": "Java, Spring Boot, MySQL, React, Python, Git, 英语CET-4",
    "target_position": "外贸销售专员",
    "job_description": "岗位职责：1. 负责海外客户开发与维护，通过邮件、电话等方式与客户沟通；2. 跟进订单全流程，管理客户档案；3. 收集市场信息，制定销售策略。要求：英语CET-4以上，客户导向思维，沟通表达能力好，有耐心和责任心。"
}

print("=== E2E Test: #11 & #12 ===")
print(f"Server: {API_URL}")
print()

try:
    r = requests.post(API_URL, json=PAYLOAD, timeout=120)
    if r.status_code != 200:
        print(f"FAIL: HTTP {r.status_code}: {r.text[:500]}")
        sys.exit(1)
    data = r.json()
except Exception as e:
    print(f"FAIL: Request error: {e}")
    sys.exit(1)

all_pass = True

# ── #11: Academic background should NOT be a standalone core_strength ──
print("─" * 60)
print("CHECK #11: 学术背景不作为独立 core_strength")
core_strengths = data.get("core_strengths", [])
bad_patterns = [
    r"软件工程.*背景.*让我",
    r"软件工程专业.*培养",
    r"作为软件工程专业",
    r"我的软件工程.*基础",
    r"软件工程.*学习.*让我",
]
found_bad = False
for i, cs in enumerate(core_strengths):
    for pat in bad_patterns:
        if re.search(pat, cs):
            print(f"  FAIL #{i+1}: '{cs[:100]}' — 匹配模式 '{pat}'")
            print(f"         学术背景作为独立core_strength暴露专业不对口")
            all_pass = False
            found_bad = True
    # Also check: if it mentions 软件工程, it should be anchored to a specific course/project action
    if "软件工程" in cs:
        # Acceptable if it mentions a specific course/project, not just the major name
        if not re.search(r"(课程|项目|实验|实践|开发|实现|设计|构建|重构)", cs):
            print(f"  WARN #{i+1}: '{cs[:100]}' — 提及软件工程但未锚定到具体课程/项目行为")
        else:
            print(f"  OK #{i+1}: '{cs[:100]}' — 有具体行为锚定")

if not found_bad:
    print("  PASS: 无独立学术背景core_strength")
print()

# ── #12: 心理委员记录习惯应该被深度挖掘 ──
print("─" * 60)
print("CHECK #12: 记录习惯/学生干部亮点深度挖掘")

# Check all bullets/campus experience bullets for 心理委员 mentions
all_bullets = []
for exp in data.get("experience", []):
    for b in exp.get("bullets", []):
        all_bullets.append(b.get("text", ""))
for exp in data.get("campus_experience", []):
    for b in exp.get("bullets", []):
        all_bullets.append(b.get("text", ""))

# Check for 心理委员 related content
psy_found = False
record_detail_found = False
for b in all_bullets:
    if any(kw in b for kw in ["心理委员", "记录", "跟进", "Excel", "归档", "台账", "结构化"]):
        psy_found = True
        # Check depth: should not just say "我负责记录"
        if re.search(r"我.*负责.*记录|我.*做.*记录", b) and len(b) < 40:
            print(f"  FAIL: '{b[:120]}' — 过于表面（'负责记录'），缺少how层")
            all_pass = False
        else:
            record_detail_found = True
            print(f"  OK: '{b[:150]}'")
            # Check for CRM/客户管理 mapping
            if any(kw in b for kw in ["客户管理", "CRM", "追溯", "跟踪", "归档", "Excel", "结构化", "分类"]):
                print(f"         ✓ 有具体方法/工具/价值描述")
            else:
                print(f"         ~ 可以更具体（建议体现工具方法或可迁移价值）")

if not psy_found:
    print("  WARN: 未找到心理委员相关bullet（可能被AI漏掉或数据未提取）")
    # Check campus_experience exists
    campus = data.get("campus_experience", [])
    if campus:
        for c in campus:
            print(f"  campus_experience role='{c.get('role','')}', bullets={len(c.get('bullets',[]))}")
    else:
        print("  campus_experience field missing from response")
else:
    if record_detail_found:
        print("  PASS: 记录习惯有深度挖掘")

# ── Summary ──
print()
print("─" * 60)
print("FINAL VERDICT")
if all_pass:
    print("PASS: #11 and #12")
else:
    print("FAIL: See details above")
print()
print(f"Career summary: {data.get('career_summary', '')[:200]}")
