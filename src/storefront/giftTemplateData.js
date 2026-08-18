const U = {
  chocolate: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=1400&q=80',
  gifts: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1400&q=80',
  love: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80',
  macarons: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=800&q=80',
  macaronsPink: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?auto=format&fit=crop&w=800&q=80',
  flowers: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80',
  bouquet: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
  wrap: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
  champagne: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80',
  darkChoco: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=800&q=80',
  spa: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
  corporate: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=800&q=80',
  box: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80',
}

export const GIFT_SHORTCUTS = [
  { id: 'sevgiliye', label: 'Sevgiliye', image: U.love },
  { id: 'yeni-is', label: 'Yeni İş', image: U.champagne },
  { id: 'dogum-gunu', label: 'Doğum Günü', image: U.macaronsPink },
  { id: 'tebrik', label: 'Tebrik', image: U.bouquet },
  { id: 'ozur', label: 'Özür', image: U.flowers },
  { id: 'tesekkur', label: 'Teşekkür', image: U.darkChoco },
  { id: 'anneler', label: 'Anneler Günü', image: U.bouquet },
  { id: 'babalar', label: 'Babalar Günü', image: U.darkChoco },
  { id: 'kendine', label: 'Kendine', image: U.spa },
  { id: 'kurumsal', label: 'Kurumsal', image: U.corporate },
]

export const GIFT_NAV = [
  'Çikolata',
  'Makaron',
  'Çiçek',
  'Hediye Kutuları',
  'Lifestyle',
  'Kurumsal',
]

export const GIFT_HERO_SLIDES = [
  {
    id: 'premium',
    eyebrow: 'Haftanın Seçkisi',
    title: 'Premium Çikolata',
    description: 'El yapımı trüfler ve Belçika çikolatalarıyla her ısırıkta lüks bir hediye deneyimi.',
    cta: 'Çikolatayı Keşfet',
    image: U.chocolate,
    panels: [
      { title: 'Makaron Kutuları', cta: 'İncele', image: U.macarons },
      { title: 'Signature Kutu', cta: 'Hediye Et', image: U.gifts },
      { title: 'Taze Buketler', cta: 'Keşfet', image: U.flowers },
    ],
  },
  {
    id: 'boxes',
    eyebrow: 'Hazır & Kişisel',
    title: 'Hediye Kutuları',
    description: 'Her an için özenle kurulu kutular — not kartı ve premium ambalaj dahil.',
    cta: 'Kutuları Gör',
    image: U.gifts,
    panels: [
      { title: 'Çikolata Seçkisi', cta: 'Keşfet', image: U.chocolate },
      { title: 'Hediye Kutuları', cta: 'İncele', image: U.wrap },
      { title: 'Kurumsal', cta: 'Teklif Al', image: U.corporate },
    ],
  },
  {
    id: 'love',
    eyebrow: 'Sevdiklerin İçin',
    title: 'Unutulmaz Anlar',
    description: 'Aynı gün teslimat seçenekleriyle özenli paketleme ve sürpriz dokunuş.',
    cta: 'Hediye Seç',
    image: U.love,
    panels: [
      { title: 'Taze Buketler', cta: 'Keşfet', image: U.flowers },
      { title: 'Premium Çikolata', cta: 'İncele', image: U.box },
      { title: 'Signature Kutu', cta: 'Hediye Et', image: U.gifts },
    ],
  },
]

export const GIFT_TABS = [
  { id: 'cok-sevilenler', label: 'Çok Sevilenler' },
  { id: 'yeni-gelenler', label: 'Yeni Gelenler' },
  { id: 'en-cok-hediye', label: 'En Çok Hediye Edilenler' },
  { id: 'indirimdekiler', label: 'İndirimdekiler' },
]

export const GIFT_DEMO_PRODUCTS = [
  { id: 'p1', name: 'Signature Kutu', price: 1890, image: U.gifts, tag: 'çok sevilen' },
  { id: 'p2', name: 'Belçika Trüf Seti', price: 1290, image: U.chocolate, tag: 'yeni' },
  { id: 'p3', name: 'Paris Makaron', price: 890, image: U.macarons, tag: 'çok sevilen' },
  { id: 'p4', name: 'Kırmızı Gül Buketi', price: 1490, image: U.flowers, tag: 'hediye' },
  { id: 'p5', name: 'Kadife Hediye Kutusu', price: 2190, image: U.wrap, tag: 'çok sevilen' },
  { id: 'p6', name: 'Spa & Mum Seti', price: 990, image: U.spa, tag: 'yeni' },
  { id: 'p7', name: 'Kurumsal İkram', price: 2490, image: U.corporate, tag: 'hediye' },
  { id: 'p8', name: 'Bitter Koleksiyon', price: 790, image: U.darkChoco, discount: 15, tag: 'indirim' },
]

export const GIFT_INSTAGRAM = [U.chocolate, U.gifts, U.macarons, U.flowers, U.wrap, U.spa]

export function money(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}
