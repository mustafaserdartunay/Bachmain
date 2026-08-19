/** Official Nilvera TEST companies from portaltest.nilvera.com integration sheet. */

export const NILVERA_TEST_SENDER = {
  code: 'test01',
  name: 'Test Kurum Bir',
  taxNumber: '1234567801',
  aliasPk: 'urn:mail:defaultpk@nilvera.com',
  aliasGb: 'urn:mail:defaultgb@nilvera.com',
  role: 'sender',
}

export const NILVERA_TEST_RECEIVER = {
  code: 'test02',
  name: 'Test Kurum İki',
  taxNumber: '1234567802',
  aliasPk: 'urn:mail:defaultpk@nilvera.com',
  aliasGb: 'urn:mail:defaultgb@nilvera.com',
  role: 'receiver',
}

export function nilveraTestPartyFields(party) {
  return {
    taxNumber: party.taxNumber,
    name: party.name,
    taxOffice: '',
    address: '',
    city: '',
    country: 'Türkiye',
    phone: '',
    email: '',
  }
}
