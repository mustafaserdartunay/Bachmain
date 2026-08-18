const HOST = 'https://static.wixstatic.com/media'
const BOX = {
  openLuxury: '59dac3_dec7d412e29749dd8264657e7f3fe568~mv2.png',
  redElephant: '59dac3_ae1712fb3fc84072aeaf7e6fd74048c4~mv2.webp',
  redLady: '59dac3_0ae576a527254134b37986e00987fb22~mv2.webp',
  pinkBunny: '59dac3_245600f4681043c3aaec33b9021ef416~mv2.webp',
  redAdventure: '59dac3_4a52895cac6244f8995c670f4a0c14f2~mv2.webp',
  blushRabbits: '59dac3_76fb55eb69e6439687ab5550d0c42843~mv2.webp',
  redRibbon: '59dac3_79640ac7d9714f19a73178dea260e2c4~mv2.webp',
  classicFrame: '59dac3_bd5f039297fc4f2b80330a1c6b1ec472~mv2.webp',
  velvetBox: '59dac3_9e0b89a7cc9c48d288ad4264b28e26c9~mv2.webp',
  miniSet: '59dac3_a3baae7a12604d4aa8ea0989c7a0839d~mv2.webp',
}

export function box(key, w = 800, h = 1422) {
  const id = BOX[key] || BOX.openLuxury
  return `${HOST}/${id}/v1/fill/w_${w},h_${h},al_c,q_90,usm_0.66_1.00_0.01,enc_auto/${id}`
}

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
  tea: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=800&q=80',
  candle: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
  box: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80',
}

const BOX_KEYS = Object.keys(BOX)

export function money(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export const GIFT_SHORTCUTS = [
  { id: 'sevgiliye', label: 'Sevgiliye', href: '/hediye/sevgiliye', image: U.love },
  { id: 'yeni-is', label: 'Yeni İş', href: '/hediye/yeni-is', image: U.champagne },
  { id: 'dogum-gunu', label: 'Doğum Günü', href: '/hediye/dogum-gunu', image: U.macaronsPink },
  { id: 'tebrik', label: 'Tebrik', href: '/hediye/tebrik', image: U.bouquet },
  { id: 'ozur', label: 'Özür', href: '/hediye/ozur', image: U.flowers },
  { id: 'tesekkur', label: 'Teşekkür', href: '/hediye/tesekkur', image: U.darkChoco },
  { id: 'anneler', label: 'Anneler Günü', href: '/hediye/anneler-gunu', image: U.bouquet },
  { id: 'babalar', label: 'Babalar Günü', href: '/hediye/babalar-gunu', image: U.darkChoco },
  { id: 'kendine', label: 'Kendine', href: '/hediye/kendine', image: U.spa },
  { id: 'kurumsal', label: 'Kurumsal', href: '/kurumsal', image: U.corporate },
]

export const GIFT_CATEGORIES = [
  {
    id: 'cat-cicek',
    name: 'Çiçek',
    slug: 'cicek',
    navLabel: 'Çiçek',
    description: 'Taze buketler, premium güller ve özel günler için özenle hazırlanmış çiçek aranjmanları.',
    image: U.flowers,
    menuGroups: [
      { title: 'Buketler', items: [
        { label: 'Gül Buketleri', href: '/kategoriler/cicek?tur=gul', image: U.flowers },
        { label: 'Mevsim Buketleri', href: '/kategoriler/cicek?tur=mevsim', image: U.bouquet },
        { label: 'Lüks Aranjmanlar', href: '/kategoriler/cicek?tur=luks', image: U.macaronsPink },
      ]},
      { title: 'Özel Günler', items: [
        { label: 'Sevgililer Günü', href: '/kategoriler/cicek?gun=sevgili', image: U.love },
        { label: 'Doğum Günü', href: '/kategoriler/cicek?gun=dogum-gunu', image: U.bouquet },
        { label: 'Tebrik', href: '/kategoriler/cicek?gun=tebrik', image: U.flowers },
      ]},
      { title: 'Kombinler', items: [
        { label: 'Çiçek + Çikolata', href: '/kategoriler/cicek?kombo=cikolata', image: box('redLady', 240, 420) },
        { label: 'Çiçek + Makaron', href: '/kategoriler/cicek?kombo=makaron', image: box('pinkBunny', 240, 420) },
      ]},
    ],
  },
  {
    id: 'cat-cikolata-makaron',
    name: 'Çikolata & Makaron',
    slug: 'cikolata-makaron',
    navLabel: 'Çikolata',
    description: 'Belçika çikolatası, el yapımı trüf ve renkli makaronlarla premium tatlı hediyeler.',
    image: box('openLuxury', 1400, 900),
    menuGroups: [
      { title: 'Çikolata', items: [
        { label: 'Premium Kutular', href: '/kategoriler/cikolata-makaron?tur=kutu', image: box('redElephant', 240, 420) },
        { label: 'Trüfler', href: '/kategoriler/cikolata-makaron?tur=truf', image: box('openLuxury', 240, 420) },
        { label: 'Bitter Seçkisi', href: '/kategoriler/cikolata-makaron?tur=bitter', image: box('redAdventure', 240, 420) },
      ]},
      { title: 'Makaron', items: [
        { label: 'Klasik Setler', href: '/kategoriler/cikolata-makaron?tur=makaron', image: box('pinkBunny', 240, 420) },
        { label: 'Renkli Kutular', href: '/kategoriler/cikolata-makaron?tur=renkli', image: box('blushRabbits', 240, 420) },
      ]},
      { title: 'Özel', items: [
        { label: 'Kişiye Özel', href: '/kategoriler/cikolata-makaron?ozel=kisiye', image: box('redLady', 240, 420) },
        { label: 'İndirimdekiler', href: '/kategoriler/cikolata-makaron?indirim=1', image: box('miniSet', 240, 420) },
      ]},
    ],
  },
  {
    id: 'cat-lifestyle',
    name: 'Lifestyle',
    slug: 'lifestyle',
    navLabel: 'Lifestyle',
    description: 'Mumlar, çay setleri ve yaşam alanına dokunan zarif lifestyle hediyeler.',
    image: U.candle,
    menuGroups: [
      { title: 'Ev & Atmosfer', items: [
        { label: 'Mumlar', href: '/kategoriler/lifestyle?tur=mum', image: U.candle },
        { label: 'Çay & Kahve', href: '/kategoriler/lifestyle?tur=cay', image: U.tea },
        { label: 'Spa Setleri', href: '/kategoriler/lifestyle?tur=spa', image: U.spa },
      ]},
      { title: 'Kendine Hediye', items: [
        { label: 'Rahatlama', href: '/kategoriler/lifestyle?mood=rahatlama', image: U.spa },
        { label: 'Motivasyon', href: '/kategoriler/lifestyle?mood=motivasyon', image: U.candle },
      ]},
    ],
  },
  {
    id: 'cat-hediye-kutulari',
    name: 'Hediye Kutuları',
    slug: 'hediye-kutulari',
    navLabel: 'Hediye Kutuları',
    description: 'Hazır veya kişiselleştirilebilir premium hediye kutuları — her an için özenli seçimler.',
    image: U.gifts,
    menuGroups: [
      { title: 'Hazır Kutular', items: [
        { label: 'Sevgiliye', href: '/kategoriler/hediye-kutulari?icin=sevgili', image: box('redLady', 240, 420) },
        { label: 'Doğum Günü', href: '/kategoriler/hediye-kutulari?icin=dogum-gunu', image: U.gifts },
        { label: 'Yeni İş', href: '/kategoriler/hediye-kutulari?icin=yeni-is', image: U.champagne },
      ]},
      { title: 'Premium', items: [
        { label: 'Lüks Kutular', href: '/kategoriler/hediye-kutulari?seviye=luks', image: box('redElephant', 240, 420) },
        { label: 'Mini Kutular', href: '/kategoriler/hediye-kutulari?seviye=mini', image: box('miniSet', 240, 420) },
      ]},
      { title: 'Kişiselleştir', items: [
        { label: 'Not Kartı', href: '/kategoriler/hediye-kutulari?ozel=not', image: U.wrap },
        { label: 'İsim Baskı', href: '/kategoriler/hediye-kutulari?ozel=isim', image: box('classicFrame', 240, 420) },
      ]},
    ],
  },
  {
    id: 'cat-kurumsal-hediye',
    name: 'Kurumsal Hediye',
    slug: 'kurumsal-hediye',
    navLabel: 'Kurumsal Hediye',
    navHref: '/kurumsal',
    navIcon: 'gift',
    description: 'Şirketiniz için toplu sipariş, markalı kutu ve kurumsal kart seçenekleri.',
    image: U.corporate,
    menuGroups: [
      { title: 'Kurumsal', items: [
        { label: 'Toplu Sipariş', href: '/kurumsal', image: U.corporate },
        { label: 'Markalı Kutular', href: '/kurumsal', image: box('classicFrame', 240, 420) },
        { label: 'Bayram Setleri', href: '/kurumsal', image: box('velvetBox', 240, 420) },
      ]},
      { title: 'Hizmetler', items: [
        { label: 'Teklif Al', href: '/kurumsal', image: box('velvetBox', 240, 420) },
        { label: 'Kurumsal Kart', href: '/kurumsal', image: box('miniSet', 240, 420) },
      ]},
    ],
  },
]

export const GIFT_NAV = GIFT_CATEGORIES.map((cat) => ({
  id: `nav-${cat.slug}`,
  label: cat.navLabel,
  href: cat.navHref || `/kategoriler/${cat.slug}`,
  slug: cat.slug,
  icon: cat.navIcon,
}))

const BASE_PRODUCTS = [
  { name: 'Belçika Trüf Koleksiyonu', slug: 'belcika-truf-koleksiyonu', shortDescription: '16’lı el yapımı Belçika trüf kutusu', price: 1290, oldPrice: 1490, discount: 13, cats: ['cat-cikolata-makaron', 'cat-hediye-kutulari'], tags: ['çikolata', 'trüf', 'hediye'], isBestseller: true, isFeatured: true, key: 'openLuxury' },
  { name: 'Paris Makaron Kutusu', slug: 'paris-makaron-kutusu', shortDescription: '12’li pastel makaron seti', price: 890, cats: ['cat-cikolata-makaron'], tags: ['makaron', 'tatlı'], isNew: true, isFeatured: true, key: 'pinkBunny' },
  { name: 'Pembe Gül Buketi', slug: 'pembe-gul-buketi', shortDescription: '15 dal taze pembe gül', price: 1590, oldPrice: 1790, discount: 11, cats: ['cat-cicek'], tags: ['çiçek', 'gül', 'sevgili'], isBestseller: true, image: U.flowers },
  { name: 'Signature Kutu', slug: 'signature-kutu', shortDescription: 'Kadife dokulu imza hediye kutusu', price: 2190, cats: ['cat-hediye-kutulari'], tags: ['kutu', 'hediye', 'luks'], isFeatured: true, key: 'redLady' },
  { name: 'Lüks Çikolata Hediye Seti', slug: 'luks-cikolata-hediye-seti', shortDescription: 'Premium bitter ve süt çikolata seti', price: 1890, cats: ['cat-cikolata-makaron'], tags: ['çikolata', 'bitter', 'kutu'], isGift: true, key: 'redAdventure' },
  { name: 'Mevsim Çiçek Aranjmanı', slug: 'mevsim-cicek-aranjmani', shortDescription: 'Mevsim çiçekleri kraft ambalajda', price: 1490, cats: ['cat-cicek'], tags: ['çiçek', 'mevsim', 'tebrik'], isNew: true, image: U.bouquet },
  { name: 'Spa Ritüel Seti', slug: 'spa-rituel-seti', shortDescription: 'Mum, yağ ve bakım ritüeli', price: 990, cats: ['cat-lifestyle'], tags: ['spa', 'kendine', 'rahatlama'], isNew: true, image: U.spa },
  { name: 'Lavanta Mum & Çay Seti', slug: 'lavanta-mum-cay-seti', shortDescription: 'Mum ve bitki çayı ikilisi', price: 890, oldPrice: 1090, discount: 18, cats: ['cat-lifestyle'], tags: ['mum', 'çay'], isBestseller: true, image: U.tea },
  { name: 'Kurumsal Premium Kutu', slug: 'kurumsal-premium-kutu', shortDescription: 'Toplu siparişe uygun prestij kutusu', price: 2490, cats: ['cat-kurumsal-hediye', 'cat-hediye-kutulari'], tags: ['kurumsal', 'kutu'], isFeatured: true, key: 'classicFrame' },
  { name: 'Romantik Çikolata & Gül', slug: 'romantik-cikolata-gul', shortDescription: 'Gül + çikolata ikilisi', price: 1990, cats: ['cat-cicek', 'cat-hediye-kutulari'], tags: ['sevgili', 'gül', 'çikolata'], isBestseller: true, isGift: true, key: 'redRibbon' },
  { name: 'Pastel Makaron Kulesi', slug: 'pastel-makaron-kulesi', shortDescription: '12’li makaron kulesi', price: 990, cats: ['cat-cikolata-makaron'], tags: ['makaron', 'doğum günü'], isNew: true, key: 'blushRabbits' },
  { name: 'Champagne Moment Kutusu', slug: 'champagne-moment-kutusu', shortDescription: 'Yeni iş ve kutlama kutusu', price: 2690, cats: ['cat-hediye-kutulari'], tags: ['yeni iş', 'kutlama', 'luks'], isFeatured: true, image: U.champagne },
  { name: 'Kurutulmuş Çiçek Buketi', slug: 'kurutulmus-cicek-buketi', shortDescription: 'Kalıcı kuru çiçek demeti', price: 1190, cats: ['cat-cicek', 'cat-lifestyle'], tags: ['çiçek', 'kuru'], isNew: true, image: U.bouquet },
  { name: 'Mini Gourmet Çikolata', slug: 'mini-gourmet-cikolata', shortDescription: '9’lu gourmet tadım kutusu', price: 690, cats: ['cat-cikolata-makaron', 'cat-kurumsal-hediye'], tags: ['çikolata', 'mini', 'teşekkür'], isBestseller: true, key: 'miniSet' },
]

const VARIANTS = [
  { name: 'Noir Trüf Seçkisi', slug: 'noir-truf-seckisi', shortDescription: '24’lü bitter trüf kutusu', price: 1490, oldPrice: 1690, discount: 12, baseIndex: 0, isBestseller: true },
  { name: 'Blush Makaron Seti', slug: 'blush-makaron-seti', shortDescription: '16’lı pudra tonları', price: 1090, baseIndex: 1, isNew: true },
  { name: 'Kırmızı Gül Buketi', slug: 'kirmizi-gul-buketi', shortDescription: '21 dal taze kırmızı gül', price: 1890, oldPrice: 2090, discount: 10, baseIndex: 2, isBestseller: true },
  { name: 'Velvet Signature Kutu', slug: 'velvet-signature-kutu', shortDescription: 'Kadife dokulu imza kutusu', price: 2390, baseIndex: 3, isFeatured: true },
  { name: 'Kakao Grand Cru Seti', slug: 'kakao-grand-cru-seti', shortDescription: 'Tek köken bitter seçkisi', price: 1790, oldPrice: 1990, discount: 10, baseIndex: 4 },
  { name: 'Bahar Buketi', slug: 'bahar-buketi', shortDescription: 'Mevsim çiçekleri kraft ambalajda', price: 1490, baseIndex: 5, isNew: true },
  { name: 'Wellness Evening Seti', slug: 'wellness-evening-seti', shortDescription: 'Mum, yağ ve peçete seti', price: 1590, baseIndex: 6, isFeatured: true },
  { name: 'Bergamot Mum Koleksiyonu', slug: 'bergamot-mum-koleksiyonu', shortDescription: 'Üçlü soy mum seti', price: 1190, oldPrice: 1390, discount: 14, baseIndex: 7 },
  { name: 'Executive Hediye Kutusu', slug: 'executive-hediye-kutusu', shortDescription: 'Kurumsal yönetici seçkisi', price: 2790, baseIndex: 8, isFeatured: true },
  { name: 'Amour Duo', slug: 'amour-duo', shortDescription: 'Gül + çikolata ikilisi', price: 1990, baseIndex: 9, isBestseller: true },
  { name: 'Pastel Tower Mini', slug: 'pastel-tower-mini', shortDescription: '12’li makaron kulesi', price: 990, baseIndex: 10, isNew: true },
  { name: 'Celebration Gold Kutusu', slug: 'celebration-gold-kutusu', shortDescription: 'Altın detaylı kutlama kutusu', price: 2690, oldPrice: 2990, discount: 10, baseIndex: 11, isFeatured: true },
  { name: 'Soft Flora Buketi', slug: 'soft-flora-buketi', shortDescription: 'Pastel kuru çiçek demeti', price: 1290, baseIndex: 12, isNew: true },
  { name: 'Petit Chocolat', slug: 'petit-chocolat', shortDescription: '6’lı tadım çikolatası', price: 490, baseIndex: 13, isBestseller: true },
  { name: 'Ruby Trüf Kutusu', slug: 'ruby-truf-kutusu', shortDescription: 'Ruby kakao trüf koleksiyonu', price: 1590, oldPrice: 1790, discount: 11, baseIndex: 0, isFeatured: true },
  { name: 'Ispahan Makaron', slug: 'ispahan-makaron', shortDescription: 'Gül-ahududu makaron seti', price: 1190, baseIndex: 1, isBestseller: true },
  { name: 'Beyaz Gül Buketi', slug: 'beyaz-gul-buketi', shortDescription: '12 dal beyaz gül', price: 1690, baseIndex: 2 },
  { name: 'Layered Surprise Kutusu', slug: 'layered-surprise-kutusu', shortDescription: 'Katmanlı sürpriz hediye', price: 2490, baseIndex: 3, isBestseller: true },
  { name: 'Praline Duo Box', slug: 'praline-duo-box', shortDescription: 'Süt & bitter praline', price: 1390, oldPrice: 1590, discount: 13, baseIndex: 4, isNew: true },
  { name: 'Lila Mevsim Aranjmanı', slug: 'lila-mevsim-aranjmani', shortDescription: 'Mor tonlarda taze aranjman', price: 1790, baseIndex: 5 },
  { name: 'Atelier Spa Kutusu', slug: 'atelier-spa-kutusu', shortDescription: 'Banyo ve bakım ritüeli', price: 1690, baseIndex: 6, isNew: true },
  { name: 'Çay & Mum Duo', slug: 'cay-mum-duo', shortDescription: 'Bitki çayı ve mum ikilisi', price: 890, oldPrice: 1090, discount: 18, baseIndex: 7, isBestseller: true },
  { name: 'Prestige Kutusu', slug: 'prestige-kutusu', shortDescription: 'Kurumsal prestij kutusu', price: 2650, baseIndex: 8, isFeatured: true },
  { name: 'Midnight Romance', slug: 'midnight-romance', shortDescription: 'Koyu gül + bitter çikolata', price: 1890, baseIndex: 9, isFeatured: true },
  { name: 'Macaron Garden', slug: 'macaron-garden', shortDescription: 'Çiçek aromalı makaronlar', price: 1290, baseIndex: 10 },
  { name: 'Toast & Treat Kutusu', slug: 'toast-treat-kutusu', shortDescription: 'Kutlama atıştırmalık seti', price: 2290, oldPrice: 2590, discount: 12, baseIndex: 11, isBestseller: true },
  { name: 'Everlasting Bloom', slug: 'everlasting-bloom', shortDescription: 'Kalıcı kuru çiçek buketi', price: 1390, baseIndex: 12, isBestseller: true },
  { name: 'Office Sweet Mini', slug: 'office-sweet-mini', shortDescription: 'Masaüstü teşekkür çikolatası', price: 590, baseIndex: 13, isNew: true },
  { name: 'Caramel Sea Salt Box', slug: 'caramel-sea-salt-box', shortDescription: 'Karamel-deniz tuzu çikolata', price: 1190, oldPrice: 1340, discount: 11, baseIndex: 0, isNew: true },
  { name: 'Citrus Macaron Box', slug: 'citrus-macaron-box', shortDescription: 'Narenciye aromalı makaron', price: 950, baseIndex: 1 },
  { name: 'Peony Dream Buketi', slug: 'peony-dream-buketi', shortDescription: 'Şakayık esintili buket', price: 2090, baseIndex: 2, isFeatured: true },
  { name: 'Artisan Unboxing Kutusu', slug: 'artisan-unboxing-kutusu', shortDescription: 'Katman katman keşif kutusu', price: 2590, baseIndex: 3, isNew: true },
  { name: 'Hazelnut Praline Trio', slug: 'hazelnut-praline-trio', shortDescription: 'Fındıklı üçlü praline', price: 990, oldPrice: 1150, discount: 14, baseIndex: 4, isBestseller: true },
  { name: 'Garden Party Aranjman', slug: 'garden-party-aranjman', shortDescription: 'Canlı renkli masa aranjmanı', price: 1990, baseIndex: 5, isBestseller: true },
  { name: 'Quiet Morning Seti', slug: 'quiet-morning-seti', shortDescription: 'Çay, mum ve defter', price: 1350, baseIndex: 6 },
  { name: 'Amber Glow Mum', slug: 'amber-glow-mum', shortDescription: 'Amber kokulu büyük soy mum', price: 790, oldPrice: 950, discount: 17, baseIndex: 7, isNew: true },
]

function toProduct(row, index) {
  const img = row.image || box(row.key || BOX_KEYS[index % BOX_KEYS.length], 800, 1422)
  const img2 = box(BOX_KEYS[(index + 3) % BOX_KEYS.length], 800, 1422)
  return {
    id: `prod-${String(index + 1).padStart(3, '0')}`,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    description: `${row.shortDescription}. Özenli paketleme, hediye notu ve aynı gün teslim seçenekleriyle gönderilir.`,
    price: row.price,
    oldPrice: row.oldPrice,
    discount: row.discount,
    image: img,
    image2: img2,
    categoryIds: row.cats,
    tags: row.tags || [],
    isNew: Boolean(row.isNew),
    isFeatured: Boolean(row.isFeatured),
    isBestseller: Boolean(row.isBestseller),
    isGift: Boolean(row.isGift || row.isBestseller || row.isFeatured),
    earliestDeliveryLabel: index % 2 === 0 ? 'Bugün 18:00’e kadar' : 'Yarın teslim',
  }
}

export const GIFT_PRODUCTS = [
  ...BASE_PRODUCTS.map((row, i) => toProduct(row, i)),
  ...VARIANTS.map((variant, i) => {
    const src = BASE_PRODUCTS[variant.baseIndex] || BASE_PRODUCTS[0]
    return toProduct({
      ...src,
      ...variant,
      cats: src.cats,
      tags: src.tags,
      key: src.key,
      image: src.image,
    }, BASE_PRODUCTS.length + i)
  }),
]

export const GIFT_TABS = [
  { id: 'cok-sevilenler', label: 'Çok Sevilenler' },
  { id: 'yeni-gelenler', label: 'Yeni Gelenler' },
  { id: 'en-cok-hediye', label: 'En Çok Hediye Edilenler' },
  { id: 'indirimdekiler', label: 'İndirimdekiler' },
]

export const HOME_PAGE_SIZE = 50

export const GIFT_HERO_SLIDES = [
  {
    id: 'premium',
    eyebrow: 'Haftanın Seçkisi',
    title: 'Premium Çikolata',
    description: 'El yapımı trüfler ve Belçika çikolatalarıyla her ısırıkta lüks bir hediye deneyimi.',
    cta: 'Çikolatayı Keşfet',
    href: '/kategoriler/cikolata-makaron',
    image: U.chocolate,
    panels: [
      { title: 'Makaron Kutuları', cta: 'İncele', href: '/urunler/paris-makaron-kutusu', image: U.macarons },
      { title: 'Signature Kutu', cta: 'Hediye Et', href: '/urunler/signature-kutu', image: U.gifts },
      { title: 'Taze Buketler', cta: 'Keşfet', href: '/kategoriler/cicek', image: U.flowers },
    ],
  },
  {
    id: 'boxes',
    eyebrow: 'Hazır & Kişisel',
    title: 'Hediye Kutuları',
    description: 'Her an için özenle kurulu kutular — not kartı ve premium ambalaj dahil.',
    cta: 'Kutuları Gör',
    href: '/kategoriler/hediye-kutulari',
    image: U.gifts,
    panels: [
      { title: 'Çikolata Seçkisi', cta: 'Keşfet', href: '/kategoriler/cikolata-makaron', image: U.chocolate },
      { title: 'Hediye Kutuları', cta: 'İncele', href: '/kategoriler/hediye-kutulari', image: U.wrap },
      { title: 'Kurumsal', cta: 'Teklif Al', href: '/kurumsal', image: U.corporate },
    ],
  },
  {
    id: 'love',
    eyebrow: 'Sevdiklerin İçin',
    title: 'Unutulmaz Anlar',
    description: 'Aynı gün teslimat seçenekleriyle özenli paketleme ve sürpriz dokunuş.',
    cta: 'Hediye Seç',
    href: '/hediye/sevgiliye',
    image: U.love,
    panels: [
      { title: 'Taze Buketler', cta: 'Keşfet', href: '/kategoriler/cicek', image: U.flowers },
      { title: 'Premium Çikolata', cta: 'İncele', href: '/kategoriler/cikolata-makaron', image: U.box },
      { title: 'Signature Kutu', cta: 'Hediye Et', href: '/urunler/signature-kutu', image: U.gifts },
    ],
  },
]

export const GIFT_INSTAGRAM = [
  { id: 'ig-1', image: U.darkChoco },
  { id: 'ig-2', image: U.flowers },
  { id: 'ig-3', image: U.macarons },
  { id: 'ig-4', image: U.gifts },
  { id: 'ig-5', image: U.spa },
  { id: 'ig-6', image: U.love },
]

export const GIFT_WINNERS = [
  { id: 'w1', displayName: 'Ayşe K.', city: 'İstanbul', prize: 'Signature Kutu', date: '2026-07-28' },
  { id: 'w2', displayName: 'Mert Y.', city: 'Ankara', prize: 'Paris Makaron Kutusu', date: '2026-07-21' },
  { id: 'w3', displayName: 'Elif S.', city: 'İzmir', prize: 'Pembe Gül Buketi', date: '2026-07-14' },
]

export const GIFT_FOOTER_COLS = [
  { title: 'Kurumsal', links: [
    { label: 'Hakkımızda', href: '/kurumsal' },
    { label: 'Mağazalar', href: '/kurumsal' },
    { label: 'Kariyer', href: '/kurumsal' },
    { label: 'Basın', href: '/kurumsal' },
  ]},
  { title: 'Müşteri Hizmetleri', links: [
    { label: 'Sipariş Takibi', href: '/hesap' },
    { label: 'Teslimat Bilgisi', href: '/kurumsal' },
    { label: 'İade & Değişim', href: '/kurumsal' },
    { label: 'SSS', href: '/kurumsal' },
  ]},
  { title: 'Hesabım', links: [
    { label: 'Giriş Yap', href: '/hesap' },
    { label: 'Siparişlerim', href: '/hesap' },
    { label: 'Favorilerim', href: '/hesap' },
    { label: 'Adreslerim', href: '/hesap' },
  ]},
  { title: 'Destek', links: [
    { label: 'İletişim', href: '/kurumsal' },
    { label: 'Gizlilik', href: '/yasal/gizlilik' },
    { label: 'KVKK', href: '/yasal/kvkk' },
    { label: 'Mesafeli Satış', href: '/yasal/mesafeli-satis' },
    { label: 'Çerez Politikası', href: '/yasal/cerez' },
  ]},
]

export const GIFT_TRUST = [
  { id: 't1', label: 'Aynı gün teslim', description: 'Seçili bölgelerde bugün kapında' },
  { id: 't2', label: 'Güvenli ödeme', description: '3D Secure ve kayıtlı kart yok' },
  { id: 't3', label: 'Özenli paketleme', description: 'Hediye notu ve premium kutu' },
  { id: 't4', label: 'Taze ürün', description: 'Günlük hazırlık ve soğuk zincir' },
  { id: 't5', label: 'Kolay iade', description: '14 gün içinde sorunsuz değişim' },
]

export function productsForTab(products, tabId) {
  const PAGE_SIZE = HOME_PAGE_SIZE
  let matched = products
  if (tabId === 'yeni-gelenler') matched = products.filter((p) => p.isNew)
  else if (tabId === 'en-cok-hediye') matched = products.filter((p) => p.isGift || p.isFeatured)
  else if (tabId === 'indirimdekiler') matched = products.filter((p) => p.discount > 0)
  else matched = products.filter((p) => p.isBestseller || p.isFeatured)
  if (matched.length >= PAGE_SIZE) return matched.slice(0, PAGE_SIZE)
  const ids = new Set(matched.map((p) => p.id))
  return [...matched, ...products.filter((p) => !ids.has(p.id))].slice(0, PAGE_SIZE)
}

export function findCategory(slug) {
  return GIFT_CATEGORIES.find((c) => c.slug === slug) || null
}

export function findProduct(slug) {
  return GIFT_PRODUCTS.find((p) => p.slug === slug) || null
}

export function productsByCategory(slug) {
  const cat = findCategory(slug)
  if (!cat) return GIFT_PRODUCTS
  return GIFT_PRODUCTS.filter((p) => p.categoryIds.includes(cat.id))
}

export const GIFT_DEMO_PRODUCTS = GIFT_PRODUCTS

export const GIFT_CITIES = [
  { name: 'İstanbul', districts: ['Beşiktaş', 'Kadıköy', 'Şişli', 'Üsküdar', 'Bakırköy', 'Sarıyer'] },
  { name: 'Ankara', districts: ['Çankaya', 'Keçiören', 'Yenimahalle'] },
  { name: 'İzmir', districts: ['Konak', 'Bornova', 'Karşıyaka'] },
]

export const GIFT_LEGAL = {
  gizlilik: {
    title: 'Gizlilik Politikası',
    body: 'Kişisel verileriniz sipariş, teslimat ve müşteri hizmetleri süreçleri için işlenir. Verileriniz üçüncü kişilerle pazarlama amacıyla paylaşılmaz.',
  },
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    body: '6698 sayılı Kanun kapsamında veri sorumlusu sıfatıyla; kimlik, iletişim ve sipariş bilgilerinizi sözleşmenin ifası amacıyla işleriz.',
  },
  'mesafeli-satis': {
    title: 'Mesafeli Satış Sözleşmesi',
    body: 'Sipariş onayıyla birlikte ürünler belirtilen teslimat adresine gönderilir. Cayma hakkı, çabuk bozulan gıda ve kişiye özel ürünlerde sınırlıdır.',
  },
  cerez: {
    title: 'Çerez Politikası',
    body: 'Site deneyimini iyileştirmek ve sepet tercihlerini hatırlamak için zorunlu ve analitik çerezler kullanılır.',
  },
}

export const GIFT_CORPORATE_AREAS = [
  { title: 'Kurumsal çikolata kutuları', text: 'Marka kimliğinize uygun premium çikolata koleksiyonları.' },
  { title: 'Özel logolu kutular', text: 'Şirket logolu paketleme ve kişiselleştirilmiş sunum.' },
  { title: 'Toplu sipariş', text: 'Yüzlerce adede kadar planlı üretim ve teslimat.' },
  { title: 'Çalışan hediyeleri', text: 'Bayram, yıldönümü ve takdir günleri için zarif setler.' },
  { title: 'Müşteri hediyeleri', text: 'İlişkiyi güçlendiren unutulmaz jestler.' },
  { title: 'Özel gün hediyeleri', text: 'Lansman, konferans ve VIP davetler için özel tasarım.' },
]

export const GIFT_OCCASIONS = {
  sevgiliye: { title: 'Sevgiliye Hediye', text: 'Gül, çikolata ve imza kutularıyla unutulmaz bir jest.' },
  'yeni-is': { title: 'Yeni İş Hediyesi', text: 'Kutlama kutuları ve prestij setleriyle yeni başlangıçlar.' },
  'dogum-gunu': { title: 'Doğum Günü', text: 'Makaron kuleleri, buketler ve sürpriz kutular.' },
  tebrik: { title: 'Tebrik', text: 'Başarı ve müjde anları için zarif seçkiler.' },
  ozur: { title: 'Özür', text: 'Sözlerin yetmediği anlar için özenli hediyeler.' },
  tesekkur: { title: 'Teşekkür', text: 'Mini gourmet kutular ve teşekkür setleri.' },
  'anneler-gunu': { title: 'Anneler Günü', text: 'Çiçek ve spa ritüelleriyle dolu bir gün.' },
  'babalar-gunu': { title: 'Babalar Günü', text: 'Bitter seçkiler ve prestij kutuları.' },
  kendine: { title: 'Kendine Hediye', text: 'Mum, çay ve spa setleriyle küçük bir kaçamak.' },
}

export function productsForOccasion(slug) {
  const occ = GIFT_OCCASIONS[slug]
  if (!occ) return GIFT_PRODUCTS.slice(0, 20)
  const needle = occ.title.toLocaleLowerCase('tr-TR').split(' ')[0]
  const matched = GIFT_PRODUCTS.filter((p) =>
    [...p.tags, p.name, p.shortDescription].some((v) =>
      String(v).toLocaleLowerCase('tr-TR').includes(needle),
    ),
  )
  return (matched.length ? matched : GIFT_PRODUCTS).slice(0, 20)
}
