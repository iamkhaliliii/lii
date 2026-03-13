'use client'
import React from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type ButtonStatus = 'idle' | 'loading' | 'success'

interface InteractiveHoverButtonProps {
  text?: string
  loadingText?: string
  successText?: string
  status?: ButtonStatus
  classes?: string
  disabled?: boolean
  onClick?: () => void
}

export default function InteractiveHoverButton({
  text = 'Button',
  loadingText = 'Processing...',
  successText = 'Complete!',
  status = 'idle',
  classes,
  disabled,
  onClick,
}: InteractiveHoverButtonProps) {
  const isIdle = status === 'idle'

  return (
    <button
      className={cn(
        'group relative flex min-w-[8rem] items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-background px-5 py-2 text-sm font-semibold',
        disabled && 'pointer-events-none opacity-50',
        classes
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.div
          key={status}
          className='flex items-center gap-2'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className={cn(
              'h-2 w-2 rounded-full bg-primary transition-all duration-500 group-hover:scale-[100]',
              !isIdle && 'scale-[100]'
            )}
          />
          <span
            className={cn(
              'inline-block whitespace-nowrap transition-all duration-500 group-hover:translate-x-20 group-hover:opacity-0',
              !isIdle && 'translate-x-20 opacity-0'
            )}
          >
            {text}
          </span>
          <div
            className={cn(
              'absolute inset-0 z-10 flex items-center justify-center gap-2 text-white opacity-0 transition-all duration-500 group-hover:opacity-100',
              !isIdle && 'opacity-100'
            )}
          >
            {status === 'idle' ? (
              <>
                <span>{text}</span>
                <ArrowRight className='h-3.5 w-3.5' />
              </>
            ) : status === 'loading' ? (
              <>
                <div className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                <span>{loadingText}</span>
              </>
            ) : (
              <>
                <Check className='h-3.5 w-3.5' />
                <span>{successText}</span>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </button>
  )
}
