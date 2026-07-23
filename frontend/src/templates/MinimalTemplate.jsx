/**
 * 简约模板 — 白底 + 居中头部 + 清晰分区
 * 和编辑功能共用，点击即可编辑
 */

import AutoResizeTextarea from '../components/AutoResizeTextarea'
import PhotoUpload from '../components/PhotoUpload'

export default function MinimalTemplate({ data, photo, setPhoto, updateField, updateBullet, removeBullet, addBullet, updateSkill }) {
  return (
    <div className="bg-white shadow-lg p-10" id="resume-preview">
      {/* 头部 — 左文字右照片 */}
      <div className="flex items-start gap-6 mb-6 pb-4 border-b">
        <div className="flex-1 text-center">
          <input
            value={data.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="text-3xl font-bold text-gray-900 text-center w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none"
          />
          <div className="flex justify-center gap-2 mt-2">
            <input value={data.phone} onChange={(e) => updateField('phone', e.target.value)}
              className="text-gray-500 text-sm text-center bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none w-32" />
            <span className="text-gray-300">|</span>
            <input value={data.email} onChange={(e) => updateField('email', e.target.value)}
              className="text-gray-500 text-sm text-center bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none w-48" />
          </div>
          <input value={data.target_position} onChange={(e) => updateField('target_position', e.target.value)}
            className="text-blue-600 font-medium mt-1 text-center bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none" />
        </div>
        <PhotoUpload photo={photo} setPhoto={setPhoto} className="w-24 h-32" />
      </div>

      {/* 个人总结 */}
      {data.summary && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">个人总结</h3>
          <AutoResizeTextarea value={data.summary} onChange={(e) => updateField('summary', e.target.value)} rows={3}
            className="text-gray-600 text-sm leading-relaxed w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none" />
        </div>
      )}

      {/* 教育经历 */}
      {data.education?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">教育经历</h3>
          {data.education.map((edu, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between gap-2">
                <input value={edu.school} onChange={(e) => updateField(`education.${i}.school`, e.target.value)}
                  className="font-medium text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none flex-1" />
                <span className="text-gray-400 text-sm">{edu.start_year} - {edu.end_year}</span>
              </div>
              <p className="text-gray-600 text-sm">{edu.major} | {edu.degree}{edu.gpa && ` | GPA ${edu.gpa}`}</p>
            </div>
          ))}
        </div>
      )}

      {/* 工作经历 */}
      {data.experience?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">工作经历</h3>
          {data.experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between gap-2">
                <input value={exp.company} onChange={(e) => updateField(`experience.${i}.company`, e.target.value)}
                  className="font-medium text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none flex-1" />
                <span className="text-gray-400 text-sm">{exp.start_date} - {exp.end_date}</span>
              </div>
              <input value={exp.role} onChange={(e) => updateField(`experience.${i}.role`, e.target.value)}
                className="text-gray-500 text-sm bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none w-full mb-1" />
              {exp.bullets?.map((bullet, j) => (
                <div key={j} className="flex items-start gap-1 group">
                  <span className="text-gray-400 text-sm mt-1.5 shrink-0">&bull;</span>
                  <AutoResizeTextarea value={bullet} onChange={(e) => updateBullet('experience', i, j, e.target.value)} rows={1}
                    className="text-gray-600 text-sm bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none flex-1" />
                  <button onClick={() => removeBullet('experience', i, j)}
                    className="text-red-300 text-xs opacity-0 group-hover:opacity-100 shrink-0 mt-1">x</button>
                </div>
              ))}
              <button onClick={() => addBullet('experience', i)} className="text-blue-400 text-xs mt-1 hover:text-blue-600">+ 添加要点</button>
            </div>
          ))}
        </div>
      )}

      {/* 项目经历 */}
      {data.project_experience?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">项目经历</h3>
          {data.project_experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between gap-2">
                <input value={exp.name} onChange={(e) => updateField(`project_experience.${i}.name`, e.target.value)}
                  className="font-medium text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none flex-1" />
                <span className="text-gray-400 text-sm">{exp.start_date} - {exp.end_date}</span>
              </div>
              {exp.bullets?.map((bullet, j) => (
                <div key={j} className="flex items-start gap-1 group">
                  <span className="text-gray-400 text-sm mt-1.5 shrink-0">&bull;</span>
                  <AutoResizeTextarea value={bullet} onChange={(e) => updateBullet('project_experience', i, j, e.target.value)} rows={1}
                    className="text-gray-600 text-sm bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none flex-1" />
                  <button onClick={() => removeBullet('project_experience', i, j)}
                    className="text-red-300 text-xs opacity-0 group-hover:opacity-100 shrink-0 mt-1">x</button>
                </div>
              ))}
              <button onClick={() => addBullet('project_experience', i)} className="text-blue-400 text-xs mt-1 hover:text-blue-600">+ 添加要点</button>
            </div>
          ))}
        </div>
      )}

      {/* 专业技能 */}
      {data.skills?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">专业技能</h3>
          {data.skills.map((skill, i) => (
            <div key={i} className="flex items-start gap-1 group">
              <span className="text-gray-400 text-sm mt-1.5 shrink-0">&bull;</span>
              <AutoResizeTextarea value={skill} onChange={(e) => updateSkill(i, e.target.value)} rows={1}
                className="text-gray-600 text-sm bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none flex-1" />
            </div>
          ))}
        </div>
      )}

      {/* 证书 */}
      {data.certificates?.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">证书</h3>
          <p className="text-gray-600 text-sm">{data.certificates.join('、')}</p>
        </div>
      )}
    </div>
  )
}
