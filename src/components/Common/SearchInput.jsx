import { Search } from 'lucide-react'
import {
  SEARCH_INPUT_ICON_MD_CLASS,
  SEARCH_INPUT_ICON_SM_CLASS,
  SEARCH_INPUT_MD_CLASS,
  SEARCH_INPUT_SM_CLASS,
} from '../../utils/themeMode'

export default function SearchInput({
  wrapperClassName = '',
  className = '',
  size = 'md',
  ...inputProps
}) {
  const inputClass = size === 'sm' ? SEARCH_INPUT_SM_CLASS : SEARCH_INPUT_MD_CLASS
  const iconClass = size === 'sm' ? SEARCH_INPUT_ICON_SM_CLASS : SEARCH_INPUT_ICON_MD_CLASS

  return (
    <div className={`relative ${wrapperClassName}`.trim()}>
      <Search className={iconClass} aria-hidden="true" />
      <input
        className={`${inputClass} app-search-field transition-all focus:outline-none ${className}`.trim()}
        {...inputProps}
        type={inputProps.type || 'search'}
      />
    </div>
  )
}
