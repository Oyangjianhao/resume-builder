/**
 * 后端 API 调用服务
 *
 * 类比：就像后端的 ai_service.py 封装了调 DeepSeek 的逻辑一样，
 * 这个文件封装了前端调后端的所有网络请求。
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:59105'

/**
 * 调用后端生成简历
 * @param {object} data - 组装好的简历数据（由 resumeStore.buildRequestData() 生成）
 * @returns {Promise<object>} - AI 润色后的简历数据
 */
export async function generateResume(data) {
  const response = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`请求失败: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * 上传项目文件进行深度分析
 * @param {File} file - 上传的文件（zip/docx/pdf/txt/md）
 * @param {string} description - 用户对项目的描述
 * @param {string} targetPosition - 目标岗位
 * @returns {Promise<object>} - 分析结果（bullets + interview_prep）
 */
export async function analyzeProject(file, description = '', targetPosition = '', jobDescription = '') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('description', description)
  formData.append('target_position', targetPosition)
  formData.append('job_description', jobDescription)

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`分析失败: ${response.status} - ${error}`)
  }

  const result = await response.json()
  if (result.error) {
    throw new Error(result.error)
  }

  return result
}

/**
 * 健康检查
 * @returns {Promise<boolean>}
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`)
    return response.ok
  } catch {
    return false
  }
}
