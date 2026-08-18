import { AppError } from '../../../shared/errors.js'
import { nilveraProvider } from './nilvera/NilveraProvider.js'
import type { EDocumentProvider } from './types.js'

const providers: Record<string, EDocumentProvider> = {
  nilvera: nilveraProvider,
}

export function getEDocumentProvider(id = 'nilvera'): EDocumentProvider {
  const provider = providers[id]
  if (!provider) {
    throw new AppError('PROVIDER_UNSUPPORTED', `E-belge sağlayıcısı desteklenmiyor: ${id}`, 400)
  }
  return provider
}
