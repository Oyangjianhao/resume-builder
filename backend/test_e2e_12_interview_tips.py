"""
E2E test for #12: interview_tips isomorphic mapping validation
Tests that interview_tips output:
1. Every question is specific to the candidate's real experience (not generic template questions)
2. Cross-domain questions include "why transition" and "gap bridging" types
3. Answer hints don't use forced isomorphic mapping language
4. Answer hints are concrete and actionable, not hollow encouragement
"""
import sys
import json
import requests

sys.path.insert(0, 'D:/Dev/resume-builder/backend')

API_URL = "http://localhost:59104/api/generate"

# ============================================================
# Test 1: Same-domain (tech → tech)
# ============================================================
SAME_DOMAIN = {
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
    "job_description": "岗位：Java后端开发工程师\n职责：负责后端服务的设计与开发，参与系统架构设计，编写高质量代码。要求：熟练掌握Java、Spring Boot、MySQL，了解分布式系统基础知识。"
}

# ============================================================
# Test 2: Cross-domain (tech → sales)  
# ============================================================
CROSS_DOMAIN = {
    "personal": {
        "name": "欧阳键濠",
        "phone": "13800538000",
        "email": "test@example.com",
        "self_intro": "软件工程大三学生，有连锁餐饮门店兼职经验"
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
            "company": "某连锁餐饮",
            "role": "兼职店员",
            "start_date": "2024-03",
            "end_date": "2025-06",
            "description": "在连锁餐饮门店兼职1年多，负责点单、出餐协调、高峰期客流引导。日均处理200+订单的高峰时段，积累了与各类顾客打交道和快速解决问题的经验。"
        }
    ],
    "project_experience": [
        {
            "name": "简历内容生成器",
            "start_date": "2026-03",
            "end_date": "2026-06",
            "description": "独立开发AI简历生成工具，React + FastAPI全栈，调用DeepSeek API做JD匹配分析。通过反复调整prompt策略消除AI编造数字问题。"
        }
    ],
    "skills": "Java, Spring Boot, MySQL, React, FastAPI, Python, Git",
    "target_position": "外贸销售",
    "job_description": "岗位：外贸销售\n职责：开发海外客户，跟进询盘，促成订单。要求：英语读写良好，沟通表达能力强，有服务意识，能承受一定工作压力。"
}


def test_interview_tips(name, payload, is_cross_domain=False):
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}")
    
    resp = requests.post(API_URL, json=payload, timeout=180)
    if resp.status_code != 200:
        print(f"FAIL: HTTP {resp.status_code}: {resp.text[:500]}")
        return False
    
    data = resp.json()
    tips = data.get("interview_tips", [])
    
    if not tips:
        print("FAIL: interview_tips is empty!")
        return False
    
    print(f"Generated {len(tips)} experience groups:")
    all_questions = []
    failures = []
    
    for group in tips:
        exp_name = group.get("experience_name", "?")
        questions = group.get("questions", [])
        print(f"\n  [{exp_name}] {len(questions)} questions:")
        for q in questions:
            q_text = q.get("question", "")
            q_hint = q.get("answer_hint", "")
            print(f"    Q: {q_text}")
            print(f"    A: {q_hint[:120]}...")
            all_questions.append(q)
    
    # --- Assertions ---
    
    # A1: No generic template questions
    generic_patterns = [
        "请介绍一下", "请简单介绍", "能简单介绍一下",
        "简单描述一下", "请描述一下"
    ]
    generic_count = 0
    for q in all_questions:
        q_text = q.get("question", "")
        for pat in generic_patterns:
            if pat in q_text:
                # Check if it's specific or generic
                # "请介绍一下你在XX项目中..." is acceptable
                # "请介绍一下这个项目" is generic
                if "这个" in q_text or "你的项目" in q_text or "这段经历" in q_text:
                    generic_count += 1
                    failures.append(f"Generic question: '{q_text[:60]}'")
                    break
    
    if generic_count == 0:
        print("\n  PASS: No generic template questions")
    else:
        print(f"\n  FAIL: {generic_count} generic template questions")
    
    # A2: Cross-domain must have transition motivation question
    if is_cross_domain:
        transition_keywords = ["为什么", "转行", "转型", "跨领域", "不做", "继续", "不同"]
        has_transition = False
        for q in all_questions:
            q_text = q.get("question", "")
            q_hint = q.get("answer_hint", "")
            combined = q_text + q_hint
            if any(kw in combined for kw in transition_keywords):
                has_transition = True
                print(f"\n  PASS: Transition question found: '{q_text[:60]}'")
                break
        
        if not has_transition:
            failures.append("FAIL: No transition motivation question for cross-domain scenario")
            print("\n  FAIL: No transition motivation question")
    
    # A3: Answer hints must not contain forced isomorphic mapping language
    mapping_patterns = [
        "这体现了", "这证明", "这展示", "这说明", "同构", "可迁移到",
        "映射到", "对应JD", "直接匹配", "等同于", "就相当于"
    ]
    for q in all_questions:
        hint = q.get("answer_hint", "")
        for pat in mapping_patterns:
            if pat in hint:
                failures.append(f"Mapping language in answer hint: '{pat}' in '{hint[:80]}'")
    
    if not any(any(p in q.get("answer_hint", "") for p in mapping_patterns) for q in all_questions):
        print("  PASS: No forced isomorphic mapping language in answer hints")
    
    # A4: Answer hints must not contain forbidden trigger words
    trigger_words = ["奶茶", "外卖", "快递", "流水线", "工厂", "传单", "服务员"]
    for q in all_questions:
        hint = q.get("answer_hint", "")
        for tw in trigger_words:
            if tw in hint:
                failures.append(f"Trigger word '{tw}' in answer hint: '{hint[:80]}'")
    
    if not any(any(tw in q.get("answer_hint", "") for tw in trigger_words) for q in all_questions):
        print("  PASS: No trigger words in answer hints")
    
    # A5: Answer hints should be concrete and actionable (not hollow)
    hollow_phrases = ["多学习", "多实践", "多了解", "努力提升", "加强学习"]
    for q in all_questions:
        hint = q.get("answer_hint", "")
        for hp in hollow_phrases:
            if hp in hint:
                failures.append(f"Hollow phrase '{hp}' in answer hint")
    
    if not any(any(hp in q.get("answer_hint", "") for hp in hollow_phrases) for q in all_questions):
        print("  PASS: No hollow phrases in answer hints")
    
    # Summary
    print(f"\n  --- {name} Results ---")
    if failures:
        for f in failures:
            print(f"  {f}")
        print(f"  SUMMARY: {len(failures)} failures")
        return False
    else:
        print("  ALL PASSES")
        return True


# ============ Run ============
print("=== #12 E2E Test: Interview Tips ===")
print(f"Server: {API_URL}")
print()

ok1 = test_interview_tips("Same-domain (Java→Java)", SAME_DOMAIN, is_cross_domain=False)
ok2 = test_interview_tips("Cross-domain (Tech→Sales)", CROSS_DOMAIN, is_cross_domain=True)

print("\n" + "="*60)
print("FINAL VERDICT")
print("="*60)
if ok1 and ok2:
    print("ALL TESTS PASSED")
    sys.exit(0)
else:
    if not ok1:
        print("FAIL: Same-domain test")
    if not ok2:
        print("FAIL: Cross-domain test")
    sys.exit(1)
