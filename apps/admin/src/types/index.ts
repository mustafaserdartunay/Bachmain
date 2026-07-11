export type PageStatus = 'loading' | 'success' | 'error' | 'empty'

export type BadgeVariant = 'default' | 'gold' | 'success' | 'warning' | 'danger'

export interface TableColumn<T = Record<string, unknown>> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

export interface MetricItem {
  label: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea' | 'date' | 'switch'
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  colSpan?: 1 | 2
}

export interface ModuleConfig {
  id: string
  title: string
  subtitle: string
  singularName: string
  path: string
  metrics: MetricItem[]
  columns: TableColumn[]
  formFields: FormField[]
}

export interface TimelineEvent {
  id: string
  title: string
  description?: string
  date: string
  type: 'info' | 'success' | 'warning' | 'danger'
  user?: string
}

export interface Customer {
  id: string
  company: string
  contact: string
  email: string
  phone: string
  taxNo: string
  city: string
  status: 'active' | 'trial' | 'suspended' | 'churned'
  plan: string
  mrr: number
  users: number
  createdAt: string
  licenseExpiry: string
  balance: number
}

export interface SupportTicket {
  id: string
  subject: string
  customer: string
  customerId: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
  assignee: string
  tags: string[]
  slaDeadline: string
  createdAt: string
  updatedAt: string
  description: string
  internalNotes: { id: string; author: string; content: string; date: string }[]
  attachments: { id: string; name: string; size: string }[]
  timeline: TimelineEvent[]
}
