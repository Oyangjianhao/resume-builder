"""
E2E #7: 经历挖掘深度验证 (experience depth mining)
Target: http://127.0.0.1:59104/api/generate
Tests: cross-domain (tech→sales) + same-domain (tech→tech)
"""
import json, requests, sys, re, io

# Fix GBK encoding on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

API_URL = "http://127.0.0.1:59104/api/generate"

# ── Test 1: Cross-domain (tech→sales) ──
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

# ── Test 2: Same-domain (tech→tech) ──
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

# ── Depth checks ──
# Shallow patterns: what-only descriptions without how/why
SHALLOW_PATTERNS = [
    # Bare "负责了XX"/"参与了XX" without any follow-up specifics
    (r'负责了\S+的\S+$', 'ends with bare 负责了XX的YY without how'),
    (r'参与了\S+的\S+$', 'ends with bare 参与了XX的YY without how'),
    # "完成了XX功能从设计到上线" — the classic hollow pattern
    (r'完成了\S+功能从设计到上线', 'hollow "从设计到上线" without unique decisions'),
    # "用XX技术实现了YY" without how the tech was used
    (r'用\S+技术实现了\S+功能', 'tool mention without usage specifics'),
]

# Positive depth indicators: bullet should contain at least one of these
DEPTH_INDICATORS = [
    # Decision-making language
    r'因为|由于|基于|考虑到|发现.*所以|通过.*分析|通过.*定位',
    # Specific methodologies
    r'采用|设计了.*流程|建立了.*体系|制定了.*标准|总结了.*规律',
    # Enumeration of specifics (strong depth signal: "实现了XX、YY、ZZ等")
    r'实现了\S+、\S+等|完成了\S+、\S+等|覆盖了\S+、\S+等',
    # Multi-step process descriptions
    r'先从.*再到.*最后|第一步.*第二步|先.*然后.*接着',
    # Problem-diagnosis-solution chain
    r'定位到.*是.*根因|排查.*发现|分析了.*找出|排查发现|发现.*是.*不符',
    # Improvement / documentation actions
    r'补充了|完善了|统一了|重构了|调整了',
    # Cross-team coordination
    r'与.*沟通|协调.*完成|配合.*实现',
    # Efficiency/quality/process/team/business dimension keywords
    r'(高峰|效率|流程|优化|改进|排班|协调|成本|收入|客户画像|复购|差错)',
]


def get_all_bullets(data):
    """Extract all bullet texts from response."""
    bullets = []
    for exp in data.get("experience", []):
        for b in exp.get("bullets", []):
            bullets.append(b.get("text", ""))
    return bullets


def check_shallow(bullet_text):
    """Returns list of shallow pattern matches."""
    issues = []
    for pattern, desc in SHALLOW_PATTERNS:
        if re.search(pattern, bullet_text):
            issues.append(f"  SHALLOW: {desc} → '{bullet_text[:60]}...'")
    return issues


def check_depth(bullet_text):
    """Returns True if bullet shows some depth indicators."""
    for pattern in DEPTH_INDICATORS:
        if re.search(pattern, bullet_text):
            return True
    return False


def test_scenario(name, payload, expect_cross_domain=False):
    """Run a test scenario and return (passed, failures, warnings)."""
    failures = []
    warnings = []
    
    print(f"\n{'='*60}")
    print(f"Test: {name}")
    print(f"{'='*60}")
    
    try:
        resp = requests.post(API_URL, json=payload, timeout=180)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        failures.append(f"API call failed: {e}")
        return False, failures, warnings
    
    bullets = get_all_bullets(data)
    print(f"  Got {len(bullets)} bullets across {len(data.get('experience', []))} experiences")
    
    # ── Check 1: No shallow-only bullets ──
    shallow_count = 0
    for i, bullet in enumerate(bullets):
        issues = check_shallow(bullet)
        if issues:
            shallow_count += 1
            for issue in issues:
                warnings.append(f"Bullet #{i}: {issue}")
    
    if shallow_count > 0:
        warnings.append(f"⚠ {shallow_count}/{len(bullets)} bullets match shallow patterns (may be false positives)")
    else:
        print(f"  [PASS] Check 1: No shallow-only patterns detected")
    
    # ── Check 2: At least 50% bullets show depth indicators ──
    depth_bullets = [b for b in bullets if check_depth(b)]
    depth_ratio = len(depth_bullets) / max(len(bullets), 1)
    print(f"  Depth ratio: {len(depth_bullets)}/{len(bullets)} = {depth_ratio:.0%}")
    
    if depth_ratio < 0.5:
        failures.append(f"Only {depth_ratio:.0%} bullets show depth indicators (need ≥50%)")
    else:
        print(f"  [PASS] Check 2: ≥50% bullets show depth indicators")
    
    # ── Check 3: Each bullet must be more than just "what" (minimum length check as rough proxy) ──
    short_bullets = [b for b in bullets if len(b) < 25]
    if short_bullets:
        failures.append(f"{len(short_bullets)} bullets are too short (<25 chars, likely shallow): {short_bullets}")
    else:
        print(f"  [PASS] Check 3: All bullets ≥ 25 characters")
    
    # ── Check 4: No "负责了"/"参与了" as the main verb in any bullet (strong shallow signal) ──
    weak_verb_pattern = re.compile(r'(负责了|参与了|做了|干了)\S*的')
    weak_bullets = []
    for i, bullet in enumerate(bullets):
        if weak_verb_pattern.search(bullet):
            weak_bullets.append(f"Bullet #{i}: '{bullet[:80]}...'")
    
    if weak_bullets:
        failures.append(f"{len(weak_bullets)} bullets use weak verbs (负责了/参与了/做了):\n" + "\n".join(weak_bullets))
    else:
        print(f"  [PASS] Check 4: No weak verb patterns (负责了/参与了/做了)")
    
    # ── Check 5 (cross-domain only): 兼职 bullet must show multi-dimensional analysis ──
    if expect_cross_domain:
        part_time_bullets = []
        for exp in data.get("experience", []):
            role = exp.get("role", "")
            company = exp.get("company", "")
            if "兼职" in role or "餐饮" in company or "店员" in role:
                for b in exp.get("bullets", []):
                    part_time_bullets.append(b.get("text", ""))
        
        if part_time_bullets:
            # Check if any part-time bullet touches efficiency/quality/process/team/business dimensions at how level
            deep_dimension_pattern = re.compile(
                r'(高峰.*处理|出餐.*(速度|效率|时间)|(优化|改进|调整).*(流程|方式|策略)|'
                r'(总结|发现|观察).*(规律|模式|特点)|(协调|安排|带领).*(团队|新人|同事)|'
                r'(成本|收入|损耗|利润|复购|客单价)|(客户|顾客).*(反馈|满意|需求|习惯))'
            )
            deep_count = sum(1 for b in part_time_bullets if deep_dimension_pattern.search(b))
            if deep_count == 0:
                failures.append(
                    f"Check 5 FAIL: {len(part_time_bullets)} part-time bullet(s) show no deep dimension analysis.\n"
                    f"  Bullets: {part_time_bullets}\n"
                    f"  Expected: at least one touching efficiency/quality/process/team/business at the how+why level"
                )
            else:
                print(f"  [PASS] Check 5: {deep_count}/{len(part_time_bullets)} part-time bullets show deep dimension analysis")
        else:
            warnings.append("⚠ No part-time bullets found (may not be applicable)")
    
    # ── Summary ──
    all_failures = failures
    all_warnings = warnings
    
    if all_failures:
        print(f"\n  FAILURES:")
        for f in all_failures:
            print(f"     {f}")
    
    if all_warnings:
        print(f"\n  WARNINGS:")
        for w in all_warnings:
            print(f"     {w}")
    
    passed = len(all_failures) == 0
    print(f"\n  Result: {'PASS' if passed else 'FAIL'}")
    return passed, all_failures, all_warnings


def main():
    print("E2E Test #7: 经历挖掘深度验证")
    print(f"API: {API_URL}")
    
    results = []
    
    # Test 1: Cross-domain
    p1, f1, w1 = test_scenario("Cross-domain (tech→sales)", CROSS_PAYLOAD, expect_cross_domain=True)
    results.append(("Cross-domain", p1, f1, w1))
    
    # Test 2: Same-domain
    p2, f2, w2 = test_scenario("Same-domain (tech→tech)", SAME_PAYLOAD, expect_cross_domain=False)
    results.append(("Same-domain", p2, f2, w2))
    
    # ── Final summary ──
    print(f"\n{'='*60}")
    print("FINAL SUMMARY")
    print(f"{'='*60}")
    all_pass = True
    for name, passed, failures, warnings in results:
        status = "PASS" if passed else "FAIL"
        print(f"  {name}: {status} ({len(failures)} failures, {len(warnings)} warnings)")
        if not passed:
            all_pass = False
    
    if all_pass:
        print(f"\nALL TESTS PASSED")
        sys.exit(0)
    else:
        print(f"\nSOME TESTS FAILED")
        sys.exit(1)


if __name__ == "__main__":
    main()
