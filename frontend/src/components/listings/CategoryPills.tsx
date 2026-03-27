import type { Category } from '../../types/listing'

interface CategoryPillsProps {
  categories: Category[]
  selectedSlug?: string | null
  onSelect: (slug: string | null) => void
}

export default function CategoryPills({ categories, selectedSlug, onSelect }: CategoryPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          !selectedSlug
            ? 'bg-papaya-500 text-white'
            : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
        }`}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.slug)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedSlug === cat.slug
              ? 'bg-papaya-500 text-white'
              : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
          }`}
        >
          {cat.icon && <span className="mr-1">{cat.icon}</span>}
          {cat.name}
        </button>
      ))}
    </div>
  )
}
