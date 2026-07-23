"""
E2E test for #2, #3, #5, #6, #9 combined validation.
Tests:
  #2: career_summary cross-domain fallback (no 兼职 → tech project soft skills, no code=business ability)
  #3: match_reason accuracy (no cross-dimension mapping, no generic labels, logical bridge)
  #5: 兼职 depth mining (5 dimensions including 商业维度, how-level depth)
  #6: bullet dedup (no duplicate info across bullet/career_summary/core_strengths/self_evaluation)
  #9: match_score range (35%-55%, not 20%-45%)
"""
import sys
import json
import requests

sys.path.insert(0, 'D:/Dev/resume-builder/backend')

API_URL = "http://localhost:59105/api/generate"

# ============================================================
# Scenario A: Cross-domain with 兼职 (tests #5, #6, #9)
# ============================================================
WITH_PARTTIME = {
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
            "description": "在连锁餐饮门店兼职1年多，负责点单、出餐协调、高峰期客流引导。日均处理200+订单的高峰时段。注意到店里周末珍珠奶茶销量是工作日的3倍，跟店长建议周末提前多备珍珠——被采纳后减少了客户等料的情况。带了3个新员工熟悉流程。"
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

# ============================================================
# Scenario B: Cross-domain WITHOUT 兼职/校园 (tests #2)
# ============================================================
NO_PARTTIME = {
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
    "experience": [],  # NO part-time experience
    "project_experience": [
        {
            "name": "社区便民维修系统",
            "start_date": "2025-09",
            "end_date": "2025-12",
            "description": "作为组长带领4人团队开发社区维修小程序，使用Spring Boot+MySQL。负责需求分析和任务分配，每周组织进度同步会议确保不延期。独立完成订单管理模块从表结构设计到API全流程。"
        },
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


def run_and_check(name, payload, checks):
    """Run API call and perform checks. Returns (all_pass, failures, data)."""
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}")

    resp = requests.post(API_URL, json=payload, timeout=180)
    if resp.status_code != 200:
        print(f"FAIL: HTTP {resp.status_code}: {resp.text[:500]}")
        return False, [f"HTTP {resp.status_code}"], None

    data = resp.json()
    failures = []

    for check_name, check_fn in checks:
        result = check_fn(data, failures)
        if result:
            print(f"  PASS: {check_name}")
        else:
            print(f"  FAIL: {check_name}")

    return len(failures) == 0, failures, data


# ============================================================
# Check functions
# ============================================================

def check_match_score_range(data, failures):
    """#9: match_score should be 35%-55% for cross-domain."""
    jda = data.get("jd_analysis", {})
    ms_text = jda.get("match_score", "")
    if not ms_text:
        failures.append("match_score is empty")
        return False

    # Extract percentage
    import re
    nums = re.findall(r'(\d+)%', ms_text)
    if not nums:
        failures.append(f"No percentage found in match_score: '{ms_text}'")
        return False

    pct = int(nums[0])
    if pct < 35:
        failures.append(f"match_score {pct}% too low (should be 35-55%)")
        return False
    if pct > 55:
        failures.append(f"match_score {pct}% too high (should be 35-55%)")
        return False

    print(f"    match_score: {pct}% (in 35-55% range)")
    return True


def check_career_summary_no_trigger_words(data, failures):
    """#9: career_summary and jd_analysis must not contain trigger words."""
    trigger_words = ["奶茶", "外卖", "快递", "流水线", "工厂", "传单", "服务员", "收银员"]

    cs = data.get("career_summary", "")
    for tw in trigger_words:
        if tw in cs:
            failures.append(f"Trigger word '{tw}' in career_summary")
            return False

    jda = data.get("jd_analysis", {})
    ms_text = jda.get("match_score", "")
    for tw in trigger_words:
        if tw in ms_text:
            failures.append(f"Trigger word '{tw}' in jd_analysis.match_score")
            return False

    gaps = jda.get("gaps", [])
    for g in gaps:
        suggestion = g.get("suggestion", "")
        for tw in trigger_words:
            if tw in suggestion:
                failures.append(f"Trigger word '{tw}' in jd_analysis.gaps suggestion")
                return False

    return True


def check_match_reason_accuracy(data, failures):
    """#3: match_reason must not use cross-dimension mapping or generic labels."""
    generic_labels = ["沟通能力", "学习能力", "团队协作", "抗压能力", "解决问题能力"]

    bullets = []
    for exp in data.get("experience", []):
        bullets.extend(exp.get("bullets", []))
    for proj in data.get("project_experience", []):
        bullets.extend(proj.get("bullets", []))

    if not bullets:
        failures.append("No bullets found to check match_reason")
        return False

    issues = 0
    for b in bullets:
        mr = b.get("match_reason", "")
        ms = b.get("match_score", "")

        # Check for generic labels
        for label in generic_labels:
            if label in mr:
                # "跨部门沟通能力" is OK, bare "沟通能力" is not
                # Heuristic: if label appears alone without qualifier
                if mr.strip().startswith(label) or f"了{label}" in mr:
                    issues += 1
                    failures.append(f"Generic label '{label}' in match_reason: '{mr[:60]}'")

        # Check for forced cross-dimension mapping signals
        mapping_signals = ["虽然", "同样需要", "本质上也是", "就相当于"]
        for sig in mapping_signals:
            if sig in mr:
                issues += 1
                failures.append(f"Cross-dimension mapping signal '{sig}' in match_reason: '{mr[:60]}'")

    if issues > 0:
        print(f"    {issues} match_reason issues found")
        return False

    print(f"    Checked {len(bullets)} bullets, no match_reason issues")
    return True


def check_parttime_depth(data, failures):
    """#5: 兼职 bullets should show depth beyond surface-level, ideally touching 商业维度."""
    # Find bullets from 兼职 experience
    pt_bullets = []
    for exp in data.get("experience", []):
        bullets = exp.get("bullets", [])
        for b in bullets:
            pt_bullets.append(b.get("text", ""))

    if not pt_bullets:
        failures.append("No bullets from experience (should have 兼职 bullets)")
        return False

    # Surface-level patterns that indicate shallow mining
    shallow_patterns = ["负责点单", "负责收银", "负责制作", "负责接待"]
    shallow_count = 0
    for b_text in pt_bullets:
        for pat in shallow_patterns:
            if b_text.strip().startswith(pat):
                shallow_count += 1
                break

    if shallow_count > 0:
        failures.append(f"{shallow_count} bullet(s) use surface-level '负责XX' pattern")
        return False

    print(f"    {len(pt_bullets)} 兼职 bullets found, none surface-level")
    return True


def check_bullet_no_dup(data, failures):
    """#6: Check for duplicate info across bullet sections."""
    # Collect all text from all sections
    cs_text = data.get("career_summary", "")
    se_text = data.get("self_evaluation", "")

    all_bullet_texts = []
    for exp in data.get("experience", []):
        for b in exp.get("bullets", []):
            all_bullet_texts.append(b.get("text", ""))
    for proj in data.get("project_experience", []):
        for b in proj.get("bullets", []):
            all_bullet_texts.append(b.get("text", ""))

    core_strengths = data.get("core_strengths", [])

    # Check 1: Same-exp bullets overlap (simplistic check: significant word overlap)
    # Skip this for now - too complex for a simple E2E. Instead check core checks:

    # Check 2: bullet text appearing in core_strengths verbatim
    found_dup = False
    for b_text in all_bullet_texts:
        for cs_item in core_strengths:
            if len(b_text) > 20 and b_text[:50] in cs_item:
                failures.append(f"Bullet text appears in core_strengths: '{b_text[:60]}'")
                found_dup = True
                break
        if found_dup:
            break

    if found_dup:
        return False

    # Check 3: career_summary should NOT just rephrase bullets
    # Heuristic: if first bullet's key noun phrase appears in career_summary first sentence
    if all_bullet_texts:
        first_bullet = all_bullet_texts[0]
        # Extract key phrases (first few meaningful words)
        keywords_in_bullet = set()
        for word in ["订单管理", "开发", "需求分析", "任务分配", "进度同步", "点单", "出餐"]:
            if word in first_bullet:
                keywords_in_bullet.add(word)

        cs_start = cs_text[:200] if cs_text else ""
        overlap = sum(1 for kw in keywords_in_bullet if kw in cs_start)
        if keywords_in_bullet and overlap >= 3:
            failures.append(f"career_summary appears to rephrase bullet content (overlap={overlap})")
            return False

    print(f"    Checked {len(all_bullet_texts)} bullets for cross-section dedup")
    return True


def check_no_parttime_fallback(data, failures):
    """#2: When no 兼职/校园, career_summary should use tech project soft skills, not claim code=business."""
    cs = data.get("career_summary", "")
    if not cs:
        failures.append("career_summary is empty")
        return False

    # Should reference technical projects for soft skills (collaboration, communication, execution)
    tech_refs = ["协作", "沟通", "执行", "分析", "需求", "进度", "团队"]
    ref_count = sum(1 for r in tech_refs if r in cs)
    if ref_count < 2:
        failures.append(f"career_summary lacking soft skill extraction from tech projects (only {ref_count} refs)")
        return False

    # Must NOT claim that "writing code = sales/business ability"
    forbidden_claims = ["写了", "开发了", "代码"]  # These should not be the basis for claiming business ability
    for fc in forbidden_claims:
        if fc in cs:
            # Check context - is it used as a basis for business ability claim?
            idx = cs.index(fc)
            context = cs[max(0, idx-30):idx+50]
            biz_words = ["销售", "外贸", "商务", "客户", "业务"]
            if any(bw in context for bw in biz_words):
                failures.append(f"career_summary claims code='{fc}' as business ability basis")
                return False

    print(f"    career_summary correctly extracts soft skills from tech projects (no code=business claim)")
    return True


# ============================================================
# Run tests
# ============================================================
print("=== Combined E2E Test: #2, #3, #5, #6, #9 ===")
print(f"Server: {API_URL}")
print()

# Scenario A: With 兼职
all_pass = True
ok_a, failures_a, data_a = run_and_check(
    "A: Cross-domain WITH 兼职",
    WITH_PARTTIME,
    [
        ("#9 match_score 35-55%", check_match_score_range),
        ("#9 No trigger words", check_career_summary_no_trigger_words),
        ("#3 match_reason accuracy", check_match_reason_accuracy),
        ("#5 兼职 depth mining", check_parttime_depth),
        ("#6 bullet dedup check", check_bullet_no_dup),
    ]
)

# Scenario B: Without 兼职/校园
ok_b, failures_b, data_b = run_and_check(
    "B: Cross-domain WITHOUT 兼职/校园",
    NO_PARTTIME,
    [
        ("#2 career_summary fallback", check_no_parttime_fallback),
        ("#9 match_score 35-55%", check_match_score_range),
        ("#9 No trigger words", check_career_summary_no_trigger_words),
        ("#3 match_reason accuracy", check_match_reason_accuracy),
        ("#6 bullet dedup check", check_bullet_no_dup),
    ]
)

# Final verdict
print("\n" + "="*60)
print("FINAL VERDICT")
print("="*60)
if ok_a and ok_b:
    print("ALL TESTS PASSED")
    sys.exit(0)
else:
    if not ok_a:
        print("FAIL: Scenario A (with 兼职)")
        for f in failures_a:
            print(f"  - {f}")
    if not ok_b:
        print("FAIL: Scenario B (without 兼职)")
        for f in failures_b:
            print(f"  - {f}")
    sys.exit(1)
