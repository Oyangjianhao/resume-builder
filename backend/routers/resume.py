"""
简历生成路由
"""
from fastapi import APIRouter, HTTPException

from models.schemas import ResumeRequest, ResumeResponse
from services.ai_service import generate_resume

router = APIRouter(prefix="/api", tags=["简历生成"])


@router.post("/generate", response_model=ResumeResponse, summary="生成简历", description="接收用户填写的个人信息，调用 DeepSeek AI 润色后返回结构化的专业简历数据")
def generate(req: ResumeRequest):
    """
    接收用户填写的简历信息，调用 AI 润色后返回结构化简历。

    前端把表单数据 POST 到这里，后端调 DeepSeek 生成简历。
    """
    try:
        result = generate_resume(req)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"简历生成失败: {str(e)}")


@router.get("/health", summary="健康检查", description="检查后端服务是否正常运行，返回 ok 表示服务可用")
def health_check():
    """健康检查接口，用于确认后端服务正常运行"""
    return {"status": "ok", "message": "简历生成服务运行中"}
