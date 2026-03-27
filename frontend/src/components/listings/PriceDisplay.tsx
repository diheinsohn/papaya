interface PriceDisplayProps {
  price: string
  currency?: string
  className?: string
}

const currencyConfig: Record<string, { locale: string; currency: string }> = {
  CLP: { locale: 'es-CL', currency: 'CLP' },
  USD: { locale: 'en-US', currency: 'USD' },
}

export default function PriceDisplay({ price, currency = 'CLP', className = '' }: PriceDisplayProps) {
  const config = currencyConfig[currency] || currencyConfig.CLP
  const formatted = new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(price))

  return (
    <span className={`text-lg font-bold text-warm-900 ${className}`}>
      {formatted}
    </span>
  )
}
