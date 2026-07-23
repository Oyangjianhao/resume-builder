import { useEffect, useRef } from 'react'

/**
 * GradientGlow — Apple 风格 CSS 渐变光晕背景
 * 极低透明度放射渐变光斑，极慢速 CSS 动画，无 JS 开销，无交互
 */
export default function GradientGlow() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf
    let start

    function step(ts) {
      if (!start) start = ts
      const t = (ts - start) * 0.000015 // 极慢速
      el.style.background = `
        radial-gradient(ellipse 60% 50% at ${30 + Math.sin(t) * 8}% ${20 + Math.cos(t * 1.3) * 8}%, rgba(0,113,227,0.06) 0%, transparent 70%),
        radial-gradient(ellipse 50% 45% at ${70 + Math.cos(t * 0.8) * 8}% ${75 + Math.sin(t * 0.9) * 8}%, rgba(41,151,255,0.05) 0%, transparent 70%),
        radial-gradient(ellipse 35% 30% at ${50 + Math.sin(t * 1.1) * 5}% ${50 + Math.cos(t * 0.7) * 5}%, rgba(0,113,227,0.03) 0%, transparent 70%)
      `
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={ref}
      id="gradient-glow-layer"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
