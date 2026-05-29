/**
 * 演示 CSS animation-timeline（滚动驱动动画）的 Solid 组件
 * 用于在 MDX 中测试 TSX 组件嵌入
 */
export default function AnimationTimelineDemo() {
  return (
    <div
      class="my-6 rounded-xl overflow-hidden border"
      style="border-color:var(--card-border);"
    >
      <div class="p-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        <span class="font-medium" style={{ color: 'var(--text)' }}>
          Solid 组件测试
        </span>{' '}
        — 下方为使用 <code>animation-timeline: scroll()</code> 的滚动驱动进度条
      </div>
      <div
        class="h-2 w-full origin-left"
        style="border-color:var(--card-border);background:var(--card-border);animation:scale-progress linear;animation-duration:1ms;animation-timeline:scroll(root block);animation-range:0% 100%;"
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
