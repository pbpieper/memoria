import { ACTIVE_TOOLS } from '@/data/methods'
import type { ToolId } from '@/types/tools'
import clsx from 'clsx'

interface Props {
  active: ToolId
  visited: Set<ToolId>
  onSelect: (id: ToolId) => void
}

/** One row with the five tools in use. No categories. */
export function TabBar({ active, visited, onSelect }: Props) {
  return (
    <div className="mb-1.5 flex gap-1 overflow-x-auto pb-1">
      {ACTIVE_TOOLS.map(tool => (
        <button
          key={tool.id}
          onClick={() => onSelect(tool.id)}
          className={clsx(
            'shrink-0 px-2.5 py-1.5 rounded-lg border-none text-xs font-semibold cursor-pointer transition-all duration-150',
            active === tool.id
              ? 'bg-[var(--color-green-main)] text-white shadow-md'
              : visited.has(tool.id)
              ? 'bg-[var(--color-green-faded)] text-[var(--color-green-dark)] hover:bg-[var(--color-green-bright)]'
              : 'bg-[var(--color-gray-100)] text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-200)]',
          )}
        >
          {tool.icon} {tool.label}
        </button>
      ))}
    </div>
  )
}
