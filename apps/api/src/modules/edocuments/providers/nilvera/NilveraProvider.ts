import { AppError } from '../../../../shared/errors.js'
import { nilveraRequest } from './client.js'
import { toNilveraEArchiveModel, toNilveraEInvoiceModel } from './mapper.js'
import type {
  EDocumentEnvironment,
  EDocumentProvider,
  ProviderCompanyInfo,
  ProviderCredit,
  ProviderInvoiceRow,
  SendInvoiceResult,
} from '../types.js'

function asList(data: unknown): ProviderInvoiceRow[] {
  if (Array.isArray(data)) return data as ProviderInvoiceRow[]
  if (data && typeof data === 'object') {
    const rec = data as { Content?: ProviderInvoiceRow[]; content?: ProviderInvoiceRow[] }
    return rec.Content || rec.content || []
  }
  return []
}

export const nilveraProvider: EDocumentProvider = {
  id: 'nilvera',

  async testConnection(apiKey, environment) {
    const company = await nilveraRequest<ProviderCompanyInfo>({
      apiKey,
      environment,
      path: '/general/Company',
    })
    const credits = await nilveraRequest<ProviderCredit[]>({
      apiKey,
      environment,
      path: '/general/Credits',
    }).catch(() => ({ data: [] as ProviderCredit[] }))
    return { company: company.data, credits: Array.isArray(credits.data) ? credits.data : [] }
  },

  async checkTaxpayer(apiKey, environment, taxNumber) {
    const cleaned = String(taxNumber || '').replace(/\D/g, '')
    if (cleaned.length < 10) {
      throw new AppError('INVALID_TAX_NUMBER', 'VKN 10, TCKN 11 haneli olmalıdır.', 400)
    }
    const res = await nilveraRequest<Array<Record<string, unknown>>>({
      apiKey,
      environment,
      path: `/general/GlobalCompany/Check/TaxNumber/${cleaned}`,
      query: { globalUserType: 'Invoice' },
    })
    const rows = Array.isArray(res.data) ? res.data : []
    const aliases = rows
      .flatMap((row) => {
        const alias = row.Alias || row.alias || row.Name
        return alias ? [String(alias)] : []
      })
      .filter(Boolean)
    const title = rows[0] ? String(rows[0].Title || rows[0].title || rows[0].Name || '') : null
    return {
      isEInvoiceTaxpayer: rows.length > 0,
      taxNumber: cleaned,
      title,
      aliases,
      rawCount: rows.length,
    }
  },

  async listIncoming(apiKey, environment, query) {
    const res = await nilveraRequest({
      apiKey,
      environment,
      path: '/einvoice/Purchase',
      query: { Page: 1, PageSize: 50, SortColumn: 'IssueDate', SortType: 'DESC', ...query },
    })
    return asList(res.data)
  },

  async listOutgoing(apiKey, environment, query) {
    const res = await nilveraRequest({
      apiKey,
      environment,
      path: '/einvoice/Sale',
      query: { Page: 1, PageSize: 50, SortColumn: 'IssueDate', SortType: 'DESC', ...query },
    })
    return asList(res.data)
  },

  async listArchive(apiKey, environment, query) {
    const res = await nilveraRequest({
      apiKey,
      environment,
      path: '/earchive/Invoices',
      query: { Page: 1, PageSize: 50, SortColumn: 'IssueDate', SortType: 'DESC', ...query },
    })
    return asList(res.data)
  },

  async sendInvoice(apiKey, environment, input): Promise<SendInvoiceResult> {
    if (input.asDraft) {
      const path =
        input.documentType === 'e-arsiv' ? '/earchive/Draft/Create' : '/einvoice/Draft/Create'
      const body =
        input.documentType === 'e-arsiv'
          ? toNilveraEArchiveModel(input.model as never)
          : toNilveraEInvoiceModel(input.model as never, input.customerAlias)
      const res = await nilveraRequest<{ UUID?: string; InvoiceNumber?: string }>({
        apiKey,
        environment,
        method: 'POST',
        path,
        body,
      })
      return {
        uuid: String(res.data?.UUID || input.uuid),
        invoiceNumber: res.data?.InvoiceNumber || null,
        draft: true,
      }
    }

    const path = input.documentType === 'e-arsiv' ? '/earchive/Send/Model' : '/einvoice/Send/Model'
    const body =
      input.documentType === 'e-arsiv'
        ? toNilveraEArchiveModel(input.model as never)
        : toNilveraEInvoiceModel(input.model as never, input.customerAlias)
    const res = await nilveraRequest<{ UUID?: string; InvoiceNumber?: string }>({
      apiKey,
      environment,
      method: 'POST',
      path,
      body,
    })
    return {
      uuid: String(res.data?.UUID || input.uuid),
      invoiceNumber: res.data?.InvoiceNumber || null,
      draft: false,
    }
  },

  async downloadPdf(apiKey, environment, input) {
    const res = await nilveraRequest<Buffer>({
      apiKey,
      environment,
      path: pdfPath(input),
      binary: true,
      accept: 'application/pdf',
    })
    return res.data
  },

  async downloadXml(apiKey, environment, input) {
    const res = await nilveraRequest<Buffer>({
      apiKey,
      environment,
      path: xmlPath(input),
      binary: true,
      accept: 'application/xml',
    })
    return res.data
  },

  async getCredits(apiKey, environment) {
    const res = await nilveraRequest<ProviderCredit[]>({
      apiKey,
      environment,
      path: '/general/Credits',
    })
    return Array.isArray(res.data) ? res.data : []
  },
}

function pdfPath(input: {
  uuid: string
  documentType: string
  direction: string
  draft?: boolean
}) {
  if (input.draft) {
    return input.documentType === 'e-arsiv'
      ? `/earchive/Draft/${input.uuid}/pdf`
      : `/einvoice/Draft/${input.uuid}/pdf`
  }
  if (input.documentType === 'e-arsiv') return `/earchive/Invoices/${input.uuid}/pdf`
  return input.direction === 'incoming'
    ? `/einvoice/Purchase/${input.uuid}/pdf`
    : `/einvoice/Sale/${input.uuid}/pdf`
}

function xmlPath(input: {
  uuid: string
  documentType: string
  direction: string
  draft?: boolean
}) {
  if (input.draft) {
    return input.documentType === 'e-arsiv'
      ? `/earchive/Draft/${input.uuid}/xml`
      : `/einvoice/Draft/${input.uuid}/xml`
  }
  if (input.documentType === 'e-arsiv') return `/earchive/Invoices/${input.uuid}/xml`
  return input.direction === 'incoming'
    ? `/einvoice/Purchase/${input.uuid}/xml`
    : `/einvoice/Sale/${input.uuid}/xml`
}

export async function confirmNilveraDraft(
  apiKey: string,
  environment: EDocumentEnvironment,
  uuid: string,
  documentType: string,
  alias?: string | null,
) {
  const path =
    documentType === 'e-arsiv' ? '/earchive/Draft/ConfirmAndSend' : '/einvoice/Draft/ConfirmAndSend'
  return nilveraRequest({
    apiKey,
    environment,
    method: 'POST',
    path,
    body: [{ UUID: uuid, Alias: alias || null }],
  })
}
