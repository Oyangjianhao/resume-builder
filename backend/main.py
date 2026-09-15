"""
AI 简历生成器 - FastAPI 后端入口
启动命令：uvicorn main:app --reload
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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

# 注册 API 路由（必须放在静态文件之前，确保 /api/* 优先匹配）
app.include_router(resume_router)
app.include_router(analysis_router)

# ===== 静态文件 serve（生产模式：前端打包进后端，同一 ngrok 隧道访问） =====
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(FRONTEND_DIST):
    # 静态资源子目录（assets, fonts 等）
    for sub in os.listdir(FRONTEND_DIST):
        sub_path = os.path.join(FRONTEND_DIST, sub)
        if os.path.isdir(sub_path):
            app.mount(f"/{sub}", StaticFiles(directory=sub_path), name=sub)

    # 根目录的独立文件（favicon.svg, icons.svg 等）
    for fname in os.listdir(FRONTEND_DIST):
        fpath = os.path.join(FRONTEND_DIST, fname)
        if os.path.isfile(fpath) and fname != "index.html":
            @app.get(f"/{fname}", include_in_schema=False)
            def _serve_root_file(path: str = fpath):
                return FileResponse(path)

    # SPA fallback：所有非 API 路径返回 index.html
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
