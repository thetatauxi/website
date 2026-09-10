'use client'

import React from 'react'
import Link, { LinkProps } from 'next/link'
import { useAuthLoading } from '@/components/providers/auth-loading-provider'

interface LoadingLinkProps extends LinkProps {
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

export default function LoadingLink({ children, onClick, ...props }: LoadingLinkProps) {
  const { showAuthLoading } = useAuthLoading()

  return (
    <Link
      {...props}
      onClick={(e) => {
        showAuthLoading()
        if (onClick) onClick(e)
      }}
    >
      {children}
    </Link>
  )
}
