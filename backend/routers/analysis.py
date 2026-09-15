"""
项目深度分析路由
POST /api/analyze — 接收文件上传 + 用户描述，立即返回 task_id，后台异步执行分析
GET  /api/analyze/status/{task_id} — 轮询分析进度和结果
"""
import uuid
import threading
import traceback
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, UploadFile, File, Form

from services.file_parser import parse_uploaded_file
from services.analysis_service import analyze_project

router = APIRouter()

# 文件大小限制 100MB
MAX_FILE_SIZE = 100 * 1024 * 1024

# 北京时间时区
TZ = timezone(timedelta(hours=8))

# 任务存储 { task_id: {"status": "processing"|"done"|"error", "progress": str|None, "result": dict|None, "error": str|None, "created_at": str} }
_tasks: dict[str, dict] = {}


def _run_analysis(task_id: str, content: bytes, filename: str, description: str, target_position: str, job_description: str):
    """在后台线程中解析文件 + 执行分析，通过闭包捕获 task_id 更新进度"""
    def on_progress(stage: str):
        _tasks[task_id]["progress"] = stage

    try:
        # 文件解析（可能耗时，放在后台线程避免请求超时）
        parsed = parse_uploaded_file(content, filename)
        result = analyze_project(parsed, description, target_position, job_description,
                                 progress_callback=on_progress)
        _tasks[task_id]["status"] = "done"
        _tasks[task_id]["result"] = result.model_dump()
    except ValueError as e:
        _tasks[task_id]["status"] = "error"
        _tasks[task_id]["error"] = str(e)
    except RuntimeError as e:
        _tasks[task_id]["status"] = "error"
        _tasks[task_id]["error"] = str(e)
    except Exception as e:
        _tasks[task_id]["status"] = "error"
        _tasks[task_id]["error"] = str(e)
        traceback.print_exc()


@router.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...),
    description: str = Form(default=""),
    target_position: str = Form(default=""),
    job_description: str = Form(default=""),
):
    """
    上传项目文件，立即返回 task_id，AI 在后台异步分析。
    前端用 GET /api/analyze/status/{task_id} 轮询结果。
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

    # 创建任务（文件解析移至后台线程，避免大文件同步解析导致请求超时）
    task_id = uuid.uuid4().hex[:12]
    _tasks[task_id] = {
        "status": "processing",
        "progress": "parsing",
        "result": None,
        "error": None,
        "created_at": datetime.now(TZ).isoformat(),
    }

    # 后台线程：先解析文件，再执行 AI 分析
    threading.Thread(
        target=_run_analysis,
        args=(task_id, content, filename, description, target_position, job_description),
        daemon=True,
    ).start()

    return {"task_id": task_id, "status": "processing"}


@router.get("/api/analyze/status/{task_id}")
async def get_status(task_id: str):
    """轮询分析任务的进度和结果"""
    task = _tasks.get(task_id)
    if task is None:
        return {"error": "任务不存在或已过期", "status": "unknown"}

    return {
        "task_id": task_id,
        "status": task["status"],
        "progress": task["progress"],
        "result": task.get("result"),
        "error": task.get("error"),
    }
