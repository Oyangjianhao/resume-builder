"""
AI 简历生成器 - FastAPI 后端入口
启动命令：uvicorn main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.resume import router as resume_router
from routers.analysis import router as analysis_router

app = FastAPI(
    title="AI 简历内容生成器 - 后端 API",
    description="用户提供个人信息和目标岗位，AI 生成高度匹配的简历内容。v0.2：聚焦内容生成，用户复制粘贴到自己的简历模板。",
    version="0.2.0",
)

# 允许前端跨域请求（开发阶段先全放开）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(resume_router)
app.include_router(analysis_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
