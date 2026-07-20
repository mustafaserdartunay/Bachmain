/** MCP-compatible tool descriptors for Knowledge Platform + AIOS. */

export type McpToolDescriptor = {
  name: string
  description: string
  inputSchema: Record<string, { type: string; description?: string }>
  requiresApproval?: boolean
}

export const MCP_TOOLS: McpToolDescriptor[] = [
  {
    name: 'search_documents',
    description: 'Search company knowledge index (RBAC-scoped).',
    inputSchema: { query: { type: 'string' }, limit: { type: 'number' } },
  },
  {
    name: 'search_customer',
    description: 'Search customers by name/tax/email.',
    inputSchema: { query: { type: 'string' } },
  },
  {
    name: 'search_orders',
    description: 'Search orders by number/customer/status.',
    inputSchema: { query: { type: 'string' } },
  },
  {
    name: 'search_inventory',
    description: 'Search inventory by SKU/name.',
    inputSchema: { query: { type: 'string' } },
  },
  {
    name: 'create_quote_draft',
    description: 'Create a quote draft (may require approval).',
    inputSchema: { customerId: { type: 'string' }, notes: { type: 'string' } },
    requiresApproval: false,
  },
  {
    name: 'create_task',
    description: 'Create a CRM task.',
    inputSchema: { title: { type: 'string' }, assigneeId: { type: 'string' } },
  },
  {
    name: 'generate_invoice',
    description: 'Generate invoice draft from order.',
    inputSchema: { orderId: { type: 'string' } },
    requiresApproval: true,
  },
  {
    name: 'plan_truck',
    description: 'Calculate truck load plan.',
    inputSchema: { shipmentId: { type: 'string' } },
  },
  {
    name: 'plan_route',
    description: 'Plan delivery route.',
    inputSchema: { stops: { type: 'array' } },
  },
  {
    name: 'search_templates',
    description: 'Search Document Center templates.',
    inputSchema: { query: { type: 'string' } },
  },
]

export function getMcpTool(name: string) {
  return MCP_TOOLS.find((t) => t.name === name) || null
}
