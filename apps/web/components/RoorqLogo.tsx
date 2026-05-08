import Image from 'next/image'
import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  priority?: boolean
}

export default function RoorqLogo({ className, priority }: LogoProps) {
  return (
    <Image
      src="/roorq-logo.png"
      alt="Roorq"
      width={800}
      height={241}
      priority={priority}
      sizes="(max-width: 768px) 120px, 160px"
      className={cn('block h-8 w-auto max-w-[min(100vw,12rem)] shrink-0 object-contain', className)}
    />
  )
}
