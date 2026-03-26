import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-warm-700 mb-1.5"
        >
          {label}
          {props.required && <span className="text-error-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          error
            ? 'border-error-500 focus:ring-error-500/30'
            : 'border-warm-300 focus:border-papaya-500 focus:ring-papaya-500/30'
        } placeholder:text-warm-400`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error-500">{error}</p>}
      {!error && helperText && (
        <p className="mt-1 text-sm text-warm-500">{helperText}</p>
      )}
    </div>
  )
}
