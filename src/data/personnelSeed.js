const now = new Date()
const y = now.getFullYear()
const m = String(now.getMonth() + 1).padStart(2, '0')

function day(offset) {
  const d = new Date(now)
  d.setDate(d.getDate() + offset)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${y}`
}

function monthKey(offset = 0) {
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const PERSONNEL_DEPARTMENTS = ['Üretim', 'Satış', 'Depo', 'İK', 'Muhasebe', 'Lojistik']
export const LEAVE_TYPES = ['Yıllık İzin', 'Hastalık İzni', 'Mazeret İzni', 'Ücretsiz İzin', 'Doğum İzni', 'Evlilik İzni']
export const ABSENCE_REASONS = ['Hastalık', 'Mazeret', 'Devamsızlık', 'Resmi Tatil', 'İş Kazası', 'Cezalı İzin', 'Diğer']
export const EMPLOYMENT_STATUSES = ['Aktif', 'İzinli', 'Ayrıldı', 'Deneme Süreci']

export const personnelSeed = [
  {
    id: 'per-001',
    employeeNo: 'P-1001',
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    tcNo: '12345678901',
    phone: '0532 111 22 33',
    email: 'ahmet.yilmaz@erlenbox.com',
    address: 'Organize Sanayi Bölgesi, Kocaeli',
    department: 'Üretim',
    position: 'Üretim Operatörü',
    manager: 'Mehmet Kaya',
    status: 'Aktif',
    hireDate: '12.03.2022',
    terminationDate: '',
    terminationReason: '',
    contractType: 'Belirsiz Süreli',
    workSchedule: 'Hafta içi 08:30 – 18:00',
    salary: {
      base: 42000,
      currency: 'TRY',
      paymentDay: 5,
      bankName: 'Ziraat Bankası',
      iban: 'TR12 0001 0000 0000 1234 5678 90',
    },
    bonuses: [
      { id: 'bon-1', month: monthKey(0), label: 'Performans Primi', amount: 3500, date: `05.${m}.${y}`, note: 'Üretim hedefi %112' },
      { id: 'bon-2', month: monthKey(-1), label: 'Devamsızlıksızlık Primi', amount: 1500, date: `05.${m}.${y}`, note: 'Ekim ayı tam devam' },
    ],
    attendance: [
      { id: 'att-1', date: day(-4), checkIn: '08:28', checkOut: '18:05', status: 'Geldi', workedHours: 9.5, note: '' },
      { id: 'att-2', date: day(-3), checkIn: '08:31', checkOut: '18:02', status: 'Geldi', workedHours: 9.4, note: '' },
      { id: 'att-3', date: day(-2), checkIn: '09:15', checkOut: '18:00', status: 'Geç Geldi', workedHours: 8.7, note: 'Trafik gecikmesi' },
      { id: 'att-4', date: day(-1), checkIn: '08:25', checkOut: '18:10', status: 'Geldi', workedHours: 9.6, note: '' },
      { id: 'att-5', date: day(0), checkIn: '08:30', checkOut: '', status: 'Geldi', workedHours: 0, note: 'Mesai devam ediyor' },
    ],
    absences: [
      { id: 'abs-1', date: `${String(now.getDate() - 12).padStart(2, '0')}.${m}.${y}`, reason: 'Hastalık', type: 'Raporlu', days: 1, approved: true, note: 'Aile hekimi raporu' },
    ],
    leaves: [
      { id: 'lev-1', type: 'Yıllık İzin', startDate: '20.08.2026', endDate: '27.08.2026', days: 6, status: 'Onaylandı', reason: 'Yaz tatili', approvedBy: 'İK Müdürü', requestDate: '01.07.2026' },
      { id: 'lev-2', type: 'Mazeret İzni', startDate: day(-20), endDate: day(-20), days: 1, status: 'Onaylandı', reason: 'Resmi işlem', approvedBy: 'Mehmet Kaya', requestDate: day(-22) },
    ],
    payrollHistory: [
      { id: 'pay-1', month: monthKey(-1), baseSalary: 42000, bonus: 1500, deductions: 6800, net: 36700, paidAt: `05.${m}.${y}`, note: 'Ekim maaşı' },
      { id: 'pay-2', month: monthKey(0), baseSalary: 42000, bonus: 3500, deductions: 7100, net: 38400, paidAt: '', note: 'Kasım — ödeme bekliyor' },
    ],
    documents: [
      { id: 'doc-1', label: 'İş Sözleşmesi', date: '12.03.2022', status: 'Arşivde' },
      { id: 'doc-2', label: 'SGK İşe Giriş Bildirimi', date: '12.03.2022', status: 'Tamamlandı' },
    ],
    notes: 'Vardiya lideri adayı. Forklift sertifikası mevcut.',
  },
  {
    id: 'per-002',
    employeeNo: 'P-1002',
    firstName: 'Elif',
    lastName: 'Demir',
    tcNo: '23456789012',
    phone: '0533 222 33 44',
    email: 'elif.demir@erlenbox.com',
    address: 'İzmit Merkez, Kocaeli',
    department: 'Satış',
    position: 'Satış Temsilcisi',
    manager: 'Can Öztürk',
    status: 'Aktif',
    hireDate: '05.09.2023',
    terminationDate: '',
    terminationReason: '',
    contractType: 'Belirsiz Süreli',
    workSchedule: 'Hafta içi 09:00 – 18:00',
    salary: {
      base: 38000,
      currency: 'TRY',
      paymentDay: 5,
      bankName: 'Garanti BBVA',
      iban: 'TR98 0006 2000 0000 9876 5432 10',
    },
    bonuses: [
      { id: 'bon-3', month: monthKey(0), label: 'Satış Primi', amount: 5200, date: `05.${m}.${y}`, note: 'Aylık hedef aşımı' },
    ],
    attendance: [
      { id: 'att-6', date: day(-4), checkIn: '08:55', checkOut: '18:05', status: 'Geldi', workedHours: 9.1, note: '' },
      { id: 'att-7', date: day(-3), checkIn: '', checkOut: '', status: 'Gelmedi', workedHours: 0, note: 'İzinli' },
      { id: 'att-8', date: day(-2), checkIn: '09:00', checkOut: '18:00', status: 'Geldi', workedHours: 9, note: '' },
      { id: 'att-9', date: day(-1), checkIn: '09:02', checkOut: '18:15', status: 'Geldi', workedHours: 9.2, note: '' },
    ],
    absences: [
      { id: 'abs-2', date: day(-3), reason: 'Mazeret', type: 'İzinli', days: 1, approved: true, note: 'Onaylı yıllık izin kullanımı' },
    ],
    leaves: [
      { id: 'lev-3', type: 'Yıllık İzin', startDate: day(-3), endDate: day(-3), days: 1, status: 'Onaylandı', reason: 'Kişisel', approvedBy: 'Can Öztürk', requestDate: day(-10) },
      { id: 'lev-4', type: 'Hastalık İzni', startDate: '15.12.2026', endDate: '17.12.2026', days: 3, status: 'Bekliyor', reason: 'Planlı kontrol', approvedBy: '', requestDate: day(-2) },
    ],
    payrollHistory: [
      { id: 'pay-3', month: monthKey(-1), baseSalary: 38000, bonus: 2800, deductions: 6200, net: 34600, paidAt: `05.${m}.${y}`, note: '' },
    ],
    documents: [
      { id: 'doc-3', label: 'İş Sözleşmesi', date: '05.09.2023', status: 'Arşivde' },
    ],
    notes: 'B2B müşteri portföyü sorumlusu.',
  },
  {
    id: 'per-003',
    employeeNo: 'P-1003',
    firstName: 'Mehmet',
    lastName: 'Kaya',
    tcNo: '34567890123',
    phone: '0534 333 44 55',
    email: 'mehmet.kaya@erlenbox.com',
    address: 'Gebze, Kocaeli',
    department: 'Üretim',
    position: 'Üretim Şefi',
    manager: 'Genel Müdür',
    status: 'Aktif',
    hireDate: '01.06.2019',
    terminationDate: '',
    terminationReason: '',
    contractType: 'Belirsiz Süreli',
    workSchedule: 'Hafta içi 08:00 – 17:30',
    salary: {
      base: 58000,
      currency: 'TRY',
      paymentDay: 5,
      bankName: 'İş Bankası',
      iban: 'TR45 0006 4000 0011 2233 4455 66',
    },
    bonuses: [
      { id: 'bon-4', month: monthKey(0), label: 'Yönetim Primi', amount: 8000, date: `05.${m}.${y}`, note: 'Üretim verimliliği' },
    ],
    attendance: [
      { id: 'att-10', date: day(-2), checkIn: '07:55', checkOut: '17:35', status: 'Geldi', workedHours: 9.5, note: '' },
      { id: 'att-11', date: day(-1), checkIn: '08:00', checkOut: '17:30', status: 'Geldi', workedHours: 9.5, note: '' },
    ],
    absences: [],
    leaves: [
      { id: 'lev-5', type: 'Yıllık İzin', startDate: '01.01.2027', endDate: '10.01.2027', days: 8, status: 'Onaylandı', reason: 'Yılbaşı tatili', approvedBy: 'Genel Müdür', requestDate: '01.10.2026' },
    ],
    payrollHistory: [
      { id: 'pay-4', month: monthKey(-1), baseSalary: 58000, bonus: 8000, deductions: 9800, net: 56200, paidAt: `05.${m}.${y}`, note: '' },
    ],
    documents: [],
    notes: 'Üretim vardiya planlamasından sorumlu.',
  },
  {
    id: 'per-004',
    employeeNo: 'P-1004',
    firstName: 'Zeynep',
    lastName: 'Arslan',
    tcNo: '45678901234',
    phone: '0535 444 55 66',
    email: 'zeynep.arslan@erlenbox.com',
    address: 'Darıca, Kocaeli',
    department: 'İK',
    position: 'İK Uzmanı',
    manager: 'Genel Müdür',
    status: 'Aktif',
    hireDate: '15.01.2024',
    terminationDate: '',
    terminationReason: '',
    contractType: 'Belirsiz Süreli',
    workSchedule: 'Hafta içi 09:00 – 18:00',
    salary: {
      base: 45000,
      currency: 'TRY',
      paymentDay: 5,
      bankName: 'Akbank',
      iban: 'TR33 0004 6000 0000 5566 7788 99',
    },
    bonuses: [],
    attendance: [
      { id: 'att-12', date: day(-1), checkIn: '08:58', checkOut: '18:05', status: 'Geldi', workedHours: 9.1, note: '' },
    ],
    absences: [],
    leaves: [],
    payrollHistory: [
      { id: 'pay-5', month: monthKey(-1), baseSalary: 45000, bonus: 0, deductions: 7200, net: 37800, paidAt: `05.${m}.${y}`, note: '' },
    ],
    documents: [
      { id: 'doc-4', label: 'İş Sözleşmesi', date: '15.01.2024', status: 'Arşivde' },
      { id: 'doc-5', label: 'KVKK Aydınlatma', date: '15.01.2024', status: 'İmzalandı' },
    ],
    notes: 'Personel özlük dosyaları ve bordro süreçleri.',
  },
  {
    id: 'per-005',
    employeeNo: 'P-1005',
    firstName: 'Burak',
    lastName: 'Çelik',
    tcNo: '56789012345',
    phone: '0536 555 66 77',
    email: 'burak.celik@erlenbox.com',
    address: 'Çayırova, Kocaeli',
    department: 'Depo',
    position: 'Depo Sorumlusu',
    manager: 'Mehmet Kaya',
    status: 'Ayrıldı',
    hireDate: '20.02.2021',
    terminationDate: '30.09.2025',
    terminationReason: 'İstifa — başka firmaya geçiş',
    contractType: 'Belirsiz Süreli',
    workSchedule: 'Hafta içi 08:30 – 17:30',
    salary: {
      base: 36000,
      currency: 'TRY',
      paymentDay: 5,
      bankName: 'Halkbank',
      iban: 'TR77 0001 2000 0000 3344 5566 77',
    },
    bonuses: [],
    attendance: [],
    absences: [],
    leaves: [],
    payrollHistory: [
      { id: 'pay-6', month: '2025-09', baseSalary: 36000, bonus: 0, deductions: 5900, net: 30100, paidAt: '05.10.2025', note: 'Kıdem ve ihbar hesaplandı' },
    ],
    documents: [
      { id: 'doc-6', label: 'İşten Çıkış Formu', date: '30.09.2025', status: 'Tamamlandı' },
      { id: 'doc-7', label: 'SGK İşten Ayrılış', date: '30.09.2025', status: 'Tamamlandı' },
    ],
    notes: 'Depo envanter ve sevkiyat süreçlerinden sorumluydu.',
  },
]
