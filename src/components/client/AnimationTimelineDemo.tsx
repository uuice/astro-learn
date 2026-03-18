/**
 * 演示 CSS animation-timeline（滚动驱动动画）的 React 组件
 * 用于在 MDX 中测试 TSX 组件嵌入
 */
export default function AnimationTimelineDemo() {
  return (
    <div className="my-6 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--card-border)' }}>
      <div className="p-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        <span className="font-medium" style={{ color: 'var(--text)' }}>React 组件测试</span>
        {' '}— 下方为使用 <code>animation-timeline: scroll()</code> 的滚动驱动进度条
      </div>
      <div
        className="h-2 w-full origin-left"
        style={{
          background: 'var(--card-border)',
          animation: 'scale-progress linear',
          animationDuration: '1ms', // Firefox 需要此属性才能应用滚动时间轴
          animationTimeline: 'scroll(root block)',
          animationRange: '0% 100%',
        }}
      />
      <style>{`
        @keyframes scale-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  )
}
