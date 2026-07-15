import './Spinner.css'

type SpinnerProps = {
  size?: number
  label?: string
  className?: string
}

// 브랜드 그린 원형 로딩 스피너. label을 주면 아래에 문구를 함께 표시.
export default function Spinner({ size = 36, label, className = '' }: SpinnerProps) {
  return (
    <div className={`spinner-wrap ${className}`.trim()} role="status" aria-live="polite">
      <span
        className="spinner"
        style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 10)) }}
      />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  )
}
