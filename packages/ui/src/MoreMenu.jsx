import { MoreHorizontal } from 'lucide-react'
import { Dropdown, DropdownItem, DropdownSeparator } from './Dropdown'
import { Button } from './Button'

/**
 * Row overflow menu — Sil / Düzenle / Yazdır / Excel / PDF / …
 * @param {{ items: Array<{ id?: string, label?: string, icon?: any, onClick?: Function, tone?: string, type?: 'separator' }> }} props
 */
export function MoreMenu({
  items = [],
  align = 'end',
  className = '',
  menuClassName = 'az customer-filter-dropdown-menu customers-page-menu',
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
        items.map((item, index) =>
          item.type === 'separator' ? (
            <DropdownSeparator key={item.id || `sep-${index}`} />
          ) : (
            <DropdownItem
              key={item.id || item.label}
              icon={item.icon}
              label={item.label}
              tone={item.tone}
              onClick={item.onClick}
              close={close}
            />
          ),
        )
      }
    </Dropdown>
  )
}

export default MoreMenu
