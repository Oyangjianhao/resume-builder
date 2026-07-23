"""core_strengths 不足 6 条时的补充生成"""
import json
import requests

from config import DEEPSEEK_API_KEY, DEEPSEEK_API_URL, DEEPSEEK_MODEL


def ensure_core_strengths_count(strengths, has_jd, job_description, target_position):
    # 新规则：4-6条均可接受，低于4条才触发补充（向下兜底，不向上强凑）
    if len(strengths) >= 4:
        return strengths

    missing = 4 - len(strengths)
    existing = "\n".join(f"- {s}" for s in strengths)
    context = f"目标岗位：{target_position}" if target_position else ""
    if has_jd and job_description:
        context += f"\nJD：{job_description[:500]}"

    prompt = (
        f"你是一个资深简历顾问，同时具备招聘方视角。\n"
        f"以下是一位求职者的核心优势，目前只有{len(strengths)}条，需要补充{missing}条。\n\n"
        f"已有的核心优势：\n{existing}\n\n"
        f"{context}\n\n"
        f"请补充恰好{missing}条新的核心优势（不要与已有的重复）。\n\n"
        "核心纪律（出现即失败）：\n"
        "1. 每条必须是只有这个人才能写出的独特事实——如果遮住名字后任何同背景候选人都能说的话，必须重写。\n"
        "2. 格式：\"在[具体场景]中我[做了什么]：[量化结果]\"。只写事实和结果，禁止\"我具备XX能力\"开头。\n"
        "3. 禁止编造用户没提过的经历/习惯/成果——用户没说过\"复盘\"就不能写\"坚持复盘\"，没说过\"运动\"就不能写\"坚持长跑\"。\n"
        "4. 每条必须有具体场景/事实/数据支撑，面试官读完能记住这个人具体做了什么。\n"
        "5. 从以下维度挖掘（优先选择已有优势中未覆盖的维度，但只写用户实际有的素材，没有的维度不要强行编造）：\n"
        "   - 教育背景带来的学习能力或专业素养\n"
        "   - 兼职/校园经历体现的软实力（沟通/领导力/执行力等）\n"
        "   - 性格特质或职业态度（必须用具体行为证明，不能只贴标签）\n"
        "6. 绝对禁止以下套话（出现即失败，面试官直接跳过）：\n"
        "   - 快速学习与适应能力、学习能力强\n"
        "   - 抗压与目标驱动、抗压能力强\n"
        "   - 客户服务意识、客户导向、B端/C端客户需求理解\n"
        "   - 需求分析能力（无具体场景支撑时）、团队协作能力（无具体场景支撑时）\n"
        "   - 沟通能力强（无具体场景支撑时）、执行力强（无具体场景支撑时）\n"
        "   - 认真负责、责任心强、工作积极主动、踏实肯干\n"
        "7. 不要在事实句后面追加\"这证明了XX\"\"这体现了XX\"等归因尾句——只用\"在XX场景下我做了YY，结果是ZZ\"结束。\n"
        "8. 自检：遮住姓名和专业后，这条能不能被同班任何同学用在自己简历上？能→套话，重写。面试官看完能否复述出\"这个人具体做了什么\"？不能→套话，重写。\n"
        "\n只返回 JSON：{\"additional\": [\"补充的第1条\", \"补充的第2条\"]}"
    )

    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        }
        data = {
            "model": DEEPSEEK_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "你是一个专业的简历内容顾问，同时具备招聘方视角。"
                        "你必须严格按照用户要求的JSON格式返回结果，不要包含任何额外文字。"
                        ""
                        "核心原则："
                        "1. 具体具体再具体——每条内容必须有可验证的事实/数据/场景支撑。"
                        "面试官读完一条，应该能复述出'这个人具体做了什么、达到了什么效果'。"
                        "面试官读完后记不住任何具体信息的内容 = 废内容 = 必须改写。"
                        "2. 挖掘深度——不要只看到经历表面（做了什么），要看到能力维度（在什么条件下、"
                        "解决了什么问题、体现了什么能力）。"
                        ""
                        "绝对禁止使用的套话（出现即失败）："
                        "快速学习与适应能力、学习能力强、抗压与目标驱动、抗压能力强、"
                        "客户服务意识、客户导向、B端/C端客户需求理解、需求分析能力、"
                        "团队协作能力、沟通能力强、执行力强、认真负责、责任心强、"
                        "工作积极主动、踏实肯干。"
                        ""
                        "正确做法：让事实自己说话。写'在XX场景下我做了YY，达到了ZZ效果'，"
                        "而不是'我具备XX能力'这种空洞断言。"
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.6,
            "max_tokens": 2000,
        }
        resp = requests.post(
            DEEPSEEK_API_URL, headers=headers, json=data, timeout=60
        )
        resp.raise_for_status()
        result = resp.json()
        text = result["choices"][0]["message"]["content"].strip()

        if "```json" in text:
            text = text[
                text.index("```json") + 7 : text.index("```", text.index("```json") + 7)
            ].strip()
        elif "```" in text:
            text = text[
                text.index("```") + 3 : text.index("```", text.index("```") + 3)
            ].strip()

        additional = json.loads(text).get("additional", [])
        return strengths + additional[:missing]
    except Exception as e:
        print(f"[WARN] core_strengths supplement failed: {e}")
        return strengths
