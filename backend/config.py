import os

# AI 模型配置
# 优先从环境变量 DEEPSEEK_API_KEY 读取，未设置时使用默认值
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
if not DEEPSEEK_API_KEY:
    raise RuntimeError("DEEPSEEK_API_KEY 环境变量未设置，请设置后再启动")
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"
