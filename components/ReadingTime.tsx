import { calculateReadingTime } from '@/lib/reading-time'

interface ReadingTimeProps {
  content: any[]
  className?: string
}

export default function ReadingTime({ content, className = '' }: ReadingTimeProps) {
  const { text, wordCount } = calculateReadingTime(content)

  return (
    <span 
      className={`inline-flex items-center text-sm ${className}`}
      style={{color: 'var(--color-text-muted)'}}
      title={`約${wordCount}文字`}
    >
      <svg 
        className="w-4 h-4 mr-1" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      {text}
    </span>
  )
}