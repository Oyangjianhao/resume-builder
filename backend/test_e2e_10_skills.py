"""
E2E test: #10 Skills scenario notes verification
Runs against http://localhost:59104/api/generate
Tests that every skill item has a concrete scenario note, not bare labels like "Java（熟练）"
"""
import sys, json, requests, re

sys.path.insert(0, 'D:/Dev/resume-builder/backend')

API_URL = "http://localhost:59104/api/generate"

# Test with full context that gives AI concrete scenarios to reference
SAME_PAYLOAD = {
    "personal": {
        "name": "欧阳键濠",
        "phone": "13800538000",
        "email": "test@example.com",
        "self_intro": "软件工程大三学生"
    },
    "education": [
        {
            "school": "广东培正学院",
            "major": "软件工程",
            "degree": "本科",
            "start_year": "2023",
            "end_year": "2027",
            "gpa": "3.5/4.0",
            "courses": "数据结构、数据库原理、Java程序设计"
        }
    ],
    "experience": [
        {
            "company": "某科技公司",
            "role": "Java后端实习生",
            "start_date": "2025-07",
            "end_date": "2025-09",
            "description": "参与社区便民维修系统后端开发，使用Spring Boot + MySQL，独立完成订单管理模块，从表结构设计到RESTful API全流程。用Redis缓存热点数据，查订单速度从秒级降到毫秒级。写了50+个JUnit单元测试用例。"
        }
    ],
    "project_experience": [
        {
            "name": "简历内容生成器",
            "start_date": "2026-03",
            "end_date": "2026-06",
            "description": "独立开发AI简历生成工具，React + FastAPI全栈，调用DeepSeek API做JD匹配分析。前端用Tailwind CSS做响应式布局，后端用Pydantic做数据验证。用Git管理代码版本。"
        }
    ],
    "skills": "Java, Spring Boot, MySQL, Redis, React, Tailwind CSS, FastAPI, Python, Git, JUnit",
    "target_position": "Java后端开发工程师",
    "job_description": "岗位职责：1. 负责后端服务的设计与开发，编写高质量Java代码；2. 参与数据库设计与SQL优化；3. 编写单元测试，保证代码质量。任职要求：1. 熟悉Java和Spring Boot框架；2. 熟悉MySQL和Redis；3. 有Git使用经验；4. 了解前端技术者优先。"
}

print("=== #10 E2E Test: Skills Scenario Notes ===")
print(f"Sending request to {API_URL} ...")

try:
    resp = requests.post(API_URL, json=SAME_PAYLOAD, timeout=180)
    print(f"Status: {resp.status_code}")

    if resp.status_code != 200:
        print(f"Error: {resp.text[:500]}")
        sys.exit(1)

    data = resp.json()
    skills = data.get("skills", [])
    
    print(f"\n--- Skills Output ({len(skills)} categories) ---")
    
    bare_patterns = [r'^[^（(]+$', r'（熟练）', r'（熟悉）', r'（了解）', r'（掌握）', r'（有项目经验）']
    issues = []
    total_items = 0
    good_items = 0
    
    for group in skills:
        cat = group.get("category", "?")
        items = group.get("items", [])
        print(f"\n{cat}:")
        for item in items:
            total_items += 1
            print(f"  {item}")
            
            # Check for bare labels (no parentheses at all)
            if not re.search(r'[（(].+[）)]', item):
                issues.append(f"BARE: [{cat}] '{item}' — no scenario note at all")
                continue
            
            # Check for hollow notes
            for bp in bare_patterns[1:]:  # skip the first (bare label check)
                if re.search(bp, item):
                    issues.append(f"HOLLOW: [{cat}] '{item}' — matched pattern: {bp}")
                    break
            else:
                good_items += 1
    
    print(f"\n=== VERDICT ===")
    print(f"Total skill items: {total_items}")
    print(f"Items with concrete scenario notes: {good_items}")
    print(f"Items with issues: {len(issues)}")
    
    if issues:
        print(f"\nISSUES FOUND:")
        for i in issues:
            print(f"  ❌ {i}")
        if good_items == 0:
            print(f"\nFAIL: 0/{total_items} items have concrete scenarios. Fix is not working.")
        else:
            print(f"\nPARTIAL: {good_items}/{total_items} items have concrete scenarios. {len(issues)} items still have issues.")
    else:
        print(f"\n✅ PASS: All {total_items} skill items have concrete scenario notes!")
    
    # Also check career_summary and jd_analysis for trigger words
    cs_text = data.get("career_summary", "")
    print(f"\nCareer summary: {cs_text[:200]}...")
    
    # Check self_evaluation
    se = data.get("self_evaluation", "")
    print(f"\nSelf evaluation: {se[:200]}...")

except Exception as e:
    print(f"EXCEPTION: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
