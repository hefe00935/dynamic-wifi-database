'use client'

interface AddWiFiButtonProps {
  onClick: () => void
}

export default function AddWiFiButton({ onClick }: AddWiFiButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl border-4 border-white transition-all duration-200 hover:scale-110"
      aria-label="Add WiFi hotspot"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={3}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4v16m8-8H4"
        />
      </svg>
    </button>
  )
}

