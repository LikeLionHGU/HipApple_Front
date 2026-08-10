import { useEffect, useRef, useState } from 'react'
import './CameraCaptureModal.css'

type CameraCaptureModalProps = {
  onCapture: (file: File) => void
  onClose: () => void
}

// getUserMedia로 카메라 스트림을 띄우고, 셔터 클릭 시 현재 프레임을 캡처해 File로 넘겨준다.
export default function CameraCaptureModal({ onCapture, onClose }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [error, setError] = useState('')
  const [isReady, setIsReady] = useState(false)

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('이 브라우저에서는 카메라를 사용할 수 없습니다.')
      return
    }

    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        setIsReady(true)
      })
      .catch(() => {
        setError('카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.')
      })

    return () => {
      cancelled = true
      stopStream()
    }
  }, [])

  const handleClose = () => {
    stopStream()
    onClose()
  }

  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], 'captured_photo.jpg', { type: 'image/jpeg' })
      stopStream()
      onCapture(file)
      onClose()
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="camera-modal-overlay" onClick={event => event.target === event.currentTarget && handleClose()}>
      <div className="camera-modal" role="dialog" aria-modal="true" aria-label="카메라로 촬영하기">
        <div className="camera-modal-head">
          <h2>카메라로 촬영하기</h2>
          <button type="button" className="camera-modal-close-icon" aria-label="닫기" onClick={handleClose}>×</button>
        </div>

        {error ? (
          <div className="camera-modal-error">
            <p role="alert">{error}</p>
            <button type="button" className="camera-modal-close" onClick={handleClose}>닫기</button>
          </div>
        ) : (
          <>
            <div className="camera-modal-viewport">
              <video ref={videoRef} className="camera-modal-video" playsInline muted />
            </div>
            <canvas ref={canvasRef} className="camera-modal-canvas" />
            <div className="camera-modal-buttons">
              <button type="button" className="camera-modal-cancel" onClick={handleClose}>취소</button>
              <button type="button" className="camera-modal-shutter" onClick={handleCapture} disabled={!isReady}>
                사진 찍기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
