export type EDocumentEnvironment = 'TEST' | 'PRODUCTION'

export type TaxpayerCheckResult = {
  isEInvoiceTaxpayer: boolean
  taxNumber: string
  title?: string | null
  aliases: string[]
  rawCount: number
}

export type ProviderCompanyInfo = {
  name?: string | null
  Name?: string | null
  taxNumber?: string | null
  TaxNumber?: string | null
  taxOffice?: string | null
  email?: string | null
  aliases?: Array<{ Alias?: string; alias?: string }>
}

export type ProviderCredit = {
  name?: string | null
  Name?: string | null
  totalCredit?: number | null
  TotalCredit?: number | null
  usedCredit?: number | null
  remainingCredit?: number | null
  RemainingCredit?: number | null
  endDate?: string | null
}

export type ProviderInvoiceRow = {
  UUID?: string | null
  InvoiceNumber?: string | null
  IssueDate?: string | null
  PayableAmount?: number | null
  TaxTotalAmount?: number | null
  CurrencyCode?: string | null
  StatusCode?: string | null
  AnswerCode?: string | null
  SenderName?: string | null
  SenderTaxNumber?: string | null
  ReceiverName?: string | null
  ReceiverTaxNumber?: string | null
  InvoiceProfile?: string | null
  InvoiceType?: string | null
  IsCancel?: boolean | null
}

export type SendInvoiceInput = {
  uuid: string
  documentType: 'e-fatura' | 'e-arsiv'
  asDraft: boolean
  customerAlias?: string | null
  model: Record<string, unknown>
}

export type SendInvoiceResult = {
  uuid: string
  invoiceNumber?: string | null
  draft?: boolean
}

export type EDocumentProvider = {
  id: string
  testConnection(
    apiKey: string,
    environment: EDocumentEnvironment,
  ): Promise<{
    company: ProviderCompanyInfo
    credits: ProviderCredit[]
  }>
  checkTaxpayer(
    apiKey: string,
    environment: EDocumentEnvironment,
    taxNumber: string,
  ): Promise<TaxpayerCheckResult>
  listIncoming(
    apiKey: string,
    environment: EDocumentEnvironment,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<ProviderInvoiceRow[]>
  listOutgoing(
    apiKey: string,
    environment: EDocumentEnvironment,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<ProviderInvoiceRow[]>
  listArchive(
    apiKey: string,
    environment: EDocumentEnvironment,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<ProviderInvoiceRow[]>
  sendInvoice(
    apiKey: string,
    environment: EDocumentEnvironment,
    input: SendInvoiceInput,
  ): Promise<SendInvoiceResult>
  downloadPdf(
    apiKey: string,
    environment: EDocumentEnvironment,
    input: { uuid: string; documentType: string; direction: string; draft?: boolean },
  ): Promise<Buffer>
  downloadXml(
    apiKey: string,
    environment: EDocumentEnvironment,
    input: { uuid: string; documentType: string; direction: string; draft?: boolean },
  ): Promise<Buffer>
  getCredits(apiKey: string, environment: EDocumentEnvironment): Promise<ProviderCredit[]>
}
