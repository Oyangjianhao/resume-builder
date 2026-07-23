"""
测试简历生成 API
用模拟数据调 POST /api/generate，验证 AI 润色效果
"""
import requests
import json

API_URL = "http://127.0.0.1:8000/api/generate"

test_data = {
    "personal": {
        "name": "欧阳键濠",
        "phone": "13800138000",
        "email": "ouyang@example.com",
        "self_intro": ""
    },
    "education": [
        {
            "school": "广东培正学院",
            "major": "软件工程",
            "degree": "本科",
            "start_year": "2023",
            "end_year": "2027",
            "gpa": "3.5/4.0",
            "courses": "数据结构、数据库原理、Java程序设计、软件工程"
        }
    ],
    "experience": [
        {
            "company": "XX科技有限公司",
            "role": "Java后端实习生",
            "start_date": "2025-07",
            "end_date": "2025-09",
            "description": "大三暑假在一个小公司实习，做Java后端开发。主要是帮公司改一个订单管理系统，之前那个系统太老了，经常卡。我用了Spring Boot重写了几个接口，加了Redis缓存，速度变快了不少。还修了一些bug，写了单元测试。带我的师傅说我代码写得还行。实习了大概两个月。"
        }
    ],
    "skills": "Java, Spring Boot, MySQL, Redis, Git, 英语CET-4",
    "target_position": "Java后端开发工程师"
}

print("正在发送测试请求，等待 AI 生成（约 10-20 秒）...\n")

response = requests.post(API_URL, json=test_data, timeout=120)

if response.status_code == 200:
    result = response.json()
    print("=" * 60)
    print(f"姓名：{result['name']}")
    print(f"目标岗位：{result['target_position']}")
    print("=" * 60)
    print(f"\n【个人总结】\n{result['summary']}")
    print(f"\n【工作经历（AI润色后）】")
    for exp in result["experience"]:
        print(f"\n  {exp['company']} | {exp['role']} | {exp['start_date']}-{exp['end_date']}")
        for bullet in exp["bullets"]:
            print(f"    - {bullet}")
    print(f"\n【技能】\n{result['skills']}")
    print(f"\n【Token 用量】{result['token_usage']}")
    print("=" * 60)
else:
    print(f"请求失败！状态码: {response.status_code}")
    print(f"错误信息: {response.text}")
