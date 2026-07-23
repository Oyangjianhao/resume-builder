/**
 * 商务模板 — 左侧深色侧栏 + 右侧主体，更正式的排版风格
 */

import AutoResizeTextarea from '../components/AutoResizeTextarea'
import PhotoUpload from '../components/PhotoUpload'

export default function BusinessTemplate({ data, photo, setPhoto, updateField, updateBullet, removeBullet, addBullet, updateSkill }) {
  return (
    <div className="bg-white shadow-lg flex min-h-[800px]" id="resume-preview">
      {/* 左侧侧栏 */}
      <div className="w-1/3 bg-gray-800 text-white p-8">
        {/* 照片 */}
        <PhotoUpload photo={photo} setPhoto={setPhoto} className="w-24 h-32 mb-4" />

        {/* 姓名 */}
        <input
          value={data.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="text-2xl font-bold text-white w-full bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-400 outline-none mb-1"
        />

        {/* 目标岗位 */}
        <input
          value={data.target_position}
          onChange={(e) => updateField('target_position', e.target.value)}
          className="text-blue-300 text-sm w-full bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-400 outline-none mb-6"
        />

        {/* 联系方式 */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-600 pb-1">联系方式</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-6">电话</span>
              <input value={data.phone} onChange={(e) => updateField('phone', e.target.value)}
                className="text-gray-200 text-sm bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-400 outline-none flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-6">邮箱</span>
              <input value={data.email} onChange={(e) => updateField('email', e.target.value)}
                className="text-gray-200 text-sm bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-400 outline-none flex-1" />
            </div>
          </div>
        </div>

        {/* 专业技能 */}
        {data.skills?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-600 pb-1">专业技能</h3>
            {data.skills.map((skill, i) => (
              <div key={i} className="mb-2 group">
                <AutoResizeTextarea value={skill} onChange={(e) => updateSkill(i, e.target.value)} rows={1}
                  className="text-gray-300 text-xs bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-400 outline-none w-full leading-relaxed" />
              </div>
            ))}
          </div>
        )}

        {/* 证书 */}
        {data.certificates?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-600 pb-1">证书</h3>
            {data.certificates.map((cert, i) => (
              <p key={i} className="text-gray-300 text-xs mb-1">{cert}</p>
            ))}
          </div>
        )}

        {/* 教育经历（放侧栏） */}
        {data.education?.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-600 pb-1">教育经历</h3>
            {data.education.map((edu, i) => (
              <div key={i} className="mb-3">
                <input value={edu.school} onChange={(e) => updateField(`education.${i}.school`, e.target.value)}
                  className="text-white text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-400 outline-none w-full" />
                <p className="text-gray-400 text-xs">{edu.major} | {edu.degree}</p>
                <p className="text-gray-500 text-xs">{edu.start_year} - {edu.end_year}</p>
                {edu.gpa && <p className="text-gray-500 text-xs">GPA {edu.gpa}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 右侧主体 */}
      <div className="w-2/3 p-8">
        {/* 个人总结 */}
        {data.summary && (
          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-800 mb-2 pb-1 border-b-2 border-gray-800">个人总结</h3>
            <AutoResizeTextarea value={data.summary} onChange={(e) => updateField('summary', e.target.value)} rows={3}
              className="text-gray-600 text-sm leading-relaxed w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none" />
          </div>
        )}

        {/* 工作经历 */}
        {data.experience?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-800 mb-3 pb-1 border-b-2 border-gray-800">工作经历</h3>
            {data.experience.map((exp, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between items-baseline gap-2">
                  <div className="flex items-baseline gap-2">
                    <input value={exp.company} onChange={(e) => updateField(`experience.${i}.company`, e.target.value)}
                      className="font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none" />
                    <span className="text-gray-400">|</span>
                    <input value={exp.role} onChange={(e) => updateField(`experience.${i}.role`, e.target.value)}
                      className="text-gray-500 text-sm bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none" />
                  </div>
                  <span className="text-gray-400 text-xs shrink-0">{exp.start_date} - {exp.end_date}</span>
                </div>
                {exp.bullets?.map((bullet, j) => (
                  <div key={j} className="flex items-start gap-1 group mt-1">
                    <span className="text-gray-300 text-xs mt-1 shrink-0">&bull;</span>
                    <AutoResizeTextarea value={bullet} onChange={(e) => updateBullet('experience', i, j, e.target.value)} rows={1}
                      className="text-gray-600 text-sm bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none resize-none flex-1" />
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
            <h3 className="text-base font-bold text-gray-800 mb-3 pb-1 border-b-2 border-gray-800">项目经历</h3>
            {data.project_experience.map((exp, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between items-baseline gap-2">
                  <input value={exp.name} onChange={(e) => updateField(`project_experience.${i}.name`, e.target.value)}
                    className="font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none" />
                  <span className="text-gray-400 text-xs shrink-0">{exp.start_date} - {exp.end_date}</span>
                </div>
                {exp.bullets?.map((bullet, j) => (
                  <div key={j} className="flex items-start gap-1 group mt-1">
                    <span className="text-gray-300 text-xs mt-1 shrink-0">&bull;</span>
                    <AutoResizeTextarea value={bullet} onChange={(e) => updateBullet('project_experience', i, j, e.target.value)} rows={1}
                      className="text-gray-600 text-sm bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-400 outline-none resize-none flex-1" />
                    <button onClick={() => removeBullet('project_experience', i, j)}
                      className="text-red-300 text-xs opacity-0 group-hover:opacity-100 shrink-0 mt-1">x</button>
                  </div>
                ))}
                <button onClick={() => addBullet('project_experience', i)} className="text-blue-400 text-xs mt-1 hover:text-blue-600">+ 添加要点</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
