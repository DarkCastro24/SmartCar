import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-classes'
import { Spinner } from './States'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  onClick,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      // Mientras carga no se usa `disabled`: el navegador le quitaría el foco y
      // lo mandaría a <body>. aria-disabled + preventDefault bloquean el clic y
      // también el envío con Enter (que dispara un clic en el botón de enviar).
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  )
}
