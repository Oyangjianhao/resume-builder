"""
项目深度分析路由
POST /api/analyze — 接收文件上传 + 用户描述，返回分析结果
"""
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

from services.file_parser import parse_uploaded_file
from services.analysis_service import analyze_project

router = APIRouter()

# 文件大小限制 100MB
MAX_FILE_SIZE = 100 * 1024 * 1024


@router.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...),
    description: str = Form(default=""),
    target_position: str = Form(default=""),
    job_description: str = Form(default=""),
):
    """
    上传项目文件，AI 深度分析后返回：
    - 简历经历描述（STAR 格式）
    - 自动识别的技术栈和角色
    - 面试准备清单
    """
    # 校验文件类型
    allowed_extensions = {'.zip', '.docx', '.pdf', '.txt', '.md'}
    filename = file.filename or "unknown"
    ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''

    if ext not in allowed_extensions:
        return {
            "error": f"不支持的文件类型: {ext}，请上传 {', '.join(allowed_extensions)} 格式的文件"
        }

    # 读取文件内容
    content = await file.read()

    # 校验文件大小
    if len(content) > MAX_FILE_SIZE:
        return {
            "error": f"文件过大（{len(content) / 1024 / 1024:.1f}MB），最大支持 100MB"
        }

    # 解析文件
    try:
        parsed = parse_uploaded_file(content, filename)
    except ValueError as e:
        return {"error": str(e)}
    except RuntimeError as e:
        return {"error": str(e)}

    # AI 分析
    try:
        result = analyze_project(parsed, description, target_position, job_description)
    except Exception as e:
        return {"error": f"AI 分析失败: {str(e)}"}

    # 检查分析是否有错误
    if "error" in (result.bullets or []):
        return {"error": "AI 分析结果异常，请重试"}

    return result.model_dump()
