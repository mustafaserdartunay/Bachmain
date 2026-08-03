import { MoreHorizontal } from 'lucide-react'
import { Dropdown, DropdownItem } from './Dropdown'
import { Button } from './Button'

/**
 * Row overflow menu — Sil / Düzenle / Yazdır / Excel / PDF / …
 * @param {{ items: Array<{ id?: string, label: string, icon?: any, onClick?: Function, tone?: string }> }} props
 */
export function MoreMenu({
  items = [],
  align = 'end',
  className = '',
  menuClassName = 'app-dropdown-portal az',
  'aria-label': ariaLabel = 'Diğer işlemler',
}) {
  return (
    <Dropdown
      align={align}
      className={className}
      menuClassName={menuClassName}
      trigger={
        <Button
          variant="ghost"
          size="iconOnly"
          className="hover:!bg-transparent"
          aria-label={ariaLabel}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      }
    >
      {({ close }) =>
        items.map((item) => (
          <DropdownItem
            key={item.id || item.label}
            icon={item.icon}
            label={item.label}
            tone={item.tone}
            onClick={item.onClick}
            close={close}
          />
        ))
      }
    </Dropdown>
  )
}

export default MoreMenu
