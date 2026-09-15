/**
 * 后端 API 调用服务
 *
 * 类比：就像后端的 ai_service.py 封装了调 DeepSeek 的逻辑一样，
 * 这个文件封装了前端调后端的所有网络请求。
 */

// 同源部署时为空（前后端同一地址），本地开发时设 http://127.0.0.1:59105
const API_BASE = import.meta.env.VITE_API_BASE || ''

// ngrok 免费版会对浏览器请求显示警告页，加上此 header 可跳过
const API_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
}

/**
 * 调用后端生成简历
 * @param {object} data - 组装好的简历数据（由 resumeStore.buildRequestData() 生成）
 * @returns {Promise<object>} - AI 润色后的简历数据
 */
export async function generateResume(data) {
  const response = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: API_HEADERS,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`请求失败: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * 启动项目深度分析（异步），立即返回 task_id
 * @param {File} file - 上传的文件（zip/docx/pdf/txt/md）
 * @param {string} description - 用户对项目的描述
 * @param {string} targetPosition - 目标岗位
 * @param {string} jobDescription - 目标岗位招聘信息
 * @returns {Promise<{task_id: string, status: string}>}
 */
export async function startAnalysis(file, description = '', targetPosition = '', jobDescription = '') {
  // 公网隧道（localtunnel）传输大文件时偶尔断连，网络级失败自动重试
  const maxAttempts = 3
  let lastError = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // FormData 不能复用同一个对象（body 已被消费），每次重建
      const body = new FormData()
      body.append('file', file)
      body.append('description', description)
      body.append('target_position', targetPosition)
      body.append('job_description', jobDescription)

      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`启动分析失败: ${response.status} - ${error}`)
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      return result  // { task_id, status }
    } catch (err) {
      // 只重试网络级失败（fetch 本身抛 TypeError），业务错误直接抛出
      const isNetworkError = err instanceof TypeError
      if (!isNetworkError || attempt === maxAttempts) {
        if (isNetworkError) {
          throw new Error('网络连接不稳定，上传失败。请稍后重试，或减小文件体积（建议 1MB 以内）')
        }
        throw err
      }
      console.warn(`上传失败（第 ${attempt} 次），${attempt}s 后自动重试...`, err.message)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000))
    }
  }
  throw lastError
}

/**
 * 轮询分析任务状态
 * @param {string} taskId
 * @returns {Promise<{task_id: string, status: string, progress: string|null, result: object|null, error: string|null}>}
 */
export async function getAnalysisStatus(taskId) {
  const response = await fetch(`${API_BASE}/api/analyze/status/${taskId}`, {
    headers: { 'ngrok-skip-browser-warning': 'true' },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`查询状态失败: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * 健康检查
 * @returns {Promise<boolean>}
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    })
    return response.ok
  } catch {
    return false
  }
}
