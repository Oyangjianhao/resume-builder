"""
E2E test for #11: self_evaluation fact-anchor validation
Tests that self_evaluation output:
1. Does NOT start with identity-label openers ("我是XX专业的", "我的XX背景")
2. Does NOT contain hollow self-praise words ("扎实的XX基础", "良好的XX能力", etc.)
3. Starts with a concrete fact/project scenario ("在XX项目中", "在XX经历中", "在XX期间")
4. Each sentence links to a verifiable behavior or project
"""
import sys
import json
import requests

sys.path.insert(0, 'D:/Dev/resume-builder/backend')

API_URL = "http://localhost:59104/api/generate"

PAYLOAD = {
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
            "description": "参与社区便民维修系统后端开发，使用Spring Boot + MySQL，独立完成订单管理模块，从表结构设计到RESTful API全流程。用Redis缓存热点数据。写了50+个JUnit单元测试用例。"
        }
    ],
    "project_experience": [
        {
            "name": "简历内容生成器",
            "start_date": "2026-03",
            "end_date": "2026-06",
            "description": "独立开发AI简历生成工具，React + FastAPI全栈，调用DeepSeek API做JD匹配分析。通过反复调整prompt策略消除AI编造数字和空洞表述的问题。"
        }
    ],
    "skills": "Java, Spring Boot, MySQL, Redis, React, Tailwind CSS, FastAPI, Python, Git, JUnit",
    "target_position": "Java后端开发工程师",
    "job_description": "岗位：Java后端开发工程师\n职责：负责后端服务的设计与开发，参与系统架构设计，编写高质量代码，进行代码审查。要求：熟练掌握Java、Spring Boot、MySQL，了解分布式系统基础知识，具备良好的问题分析和解决能力。"
}

print("=== #11 E2E Test: Self Evaluation Fact-Anchor ===")
print(f"Sending request to {API_URL} ...")

try:
    resp = requests.post(API_URL, json=PAYLOAD, timeout=180)
    print(f"Status: {resp.status_code}")

    if resp.status_code != 200:
        print(f"Error: {resp.text[:500]}")
        sys.exit(1)

    data = resp.json()
    se = data.get("self_evaluation", "")

    if not se:
        print("FAIL: self_evaluation is empty!")
        sys.exit(1)

    print(f"\n--- Self Evaluation Output ---")
    print(se)
    print("---\n")

    failures = []

    # --- Test 1: No identity-label opener ---
    identity_openers = ["我是", "我的专业", "我的背景", "我具备", "我有"]
    for opener in identity_openers:
        if se.strip().startswith(opener):
            failures.append(f"FAIL: self_evaluation starts with identity-label opener: '{opener}'")

    if not any(se.strip().startswith(o) for o in identity_openers):
        print("PASS: Does not start with identity-label opener")

    # --- Test 2: Starts with fact/concrete scenario ---
    fact_starters = ["在", "从", "通过"]
    if any(se.strip().startswith(s) for s in fact_starters):
        print("PASS: Starts with fact/concrete scenario")
    else:
        failures.append(f"FAIL: self_evaluation does not start with fact ('{se[:30]}...')")

    # --- Test 3: No hollow self-praise words ---
    hollow_words = [
        "扎实的", "良好的", "突出的", "优秀的",
        "具备XX思维", "培养了XX意识",
        "快速学习", "学习能力强", "抗压能力强",
        "认真负责", "责任心强", "工作积极主动"
    ]
    for word in hollow_words:
        if word in se:
            failures.append(f"FAIL: Contains hollow word '{word}'")

    if not any(w in se for w in hollow_words):
        print("PASS: No hollow self-praise words")

    # --- Test 4: No "我是XX专业的" identity labels anywhere ---
    if "我是" in se:
        failures.append("FAIL: Contains '我是' identity label")
    else:
        print("PASS: No identity labels anywhere in text")

    # --- Test 5: Sentences reference verifiable projects/behaviors ---
    sentences = [s.strip() for s in se.replace("！", "。").replace("？", "。").split("。") if s.strip()]
    print(f"\nSentence count: {len(sentences)}")

    project_keywords = ["项目", "经历", "实习", "课程", "兼职", "开发", "搭建", "设计", "编写", "实现",
                        "社区", "简历", "维修", "Spring", "Java", "MySQL", "前端", "后端", "数据库",
                        "测试", "单元", "需求", "deliver", "交付", "API"]
    empty_sentences = 0
    for i, sent in enumerate(sentences):
        has_ref = any(kw in sent for kw in project_keywords)
        if not has_ref:
            print(f"  WARN: Sentence {i+1} lacks concrete reference: '{sent[:60]}...'")
            empty_sentences += 1

    if empty_sentences == 0:
        print("PASS: All sentences contain verifiable project/behavior references")
    else:
        print(f"WARN: {empty_sentences}/{len(sentences)} sentences lack concrete references")

    # --- Test 6: Each sentence should follow fact→insight pattern ---
    fact_insight_good = 0
    for i, sent in enumerate(sentences):
        if any(sent.startswith(s) for s in fact_starters):
            fact_insight_good += 1
            print(f"  OK: Sentence {i+1} starts with fact pattern: '{sent[:50]}...'")
        else:
            print(f"  WARN: Sentence {i+1} may not follow fact→insight pattern: '{sent[:50]}...'")

    if fact_insight_good >= len(sentences) * 0.7:
        print(f"PASS: {fact_insight_good}/{len(sentences)} sentences follow fact→insight pattern")
    else:
        print(f"WARN: Only {fact_insight_good}/{len(sentences)} sentences follow fact→insight pattern")

    # --- Summary ---
    print(f"\n{'='*50}")
    print("RESULTS")
    print(f"{'='*50}")
    if failures:
        for f in failures:
            print(f"  {f}")
        print(f"\nSUMMARY: {len(failures)} FAILURES, {empty_sentences} warnings")
        sys.exit(1)
    else:
        print(f"ALL CORE TESTS PASSED ({empty_sentences} warnings on sentence references)")
        sys.exit(0)

except requests.exceptions.ConnectionError as e:
    print(f"CONNECTION ERROR: Is the server running on port 59104? {e}")
    sys.exit(1)
except Exception as e:
    print(f"EXCEPTION: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
