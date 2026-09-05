export const HTML_PACKS = [
  {
    id: 'furni-1.0.0',
    folder: 'Templates/furni-1.0.0',
    category: 'E-ticaret',
    name: 'Furni',
    title: 'Mobilya ve iç mimari mağazası',
    description:
      'İndirdiğin HTML5 tema birebir: vitrin, mağaza, sepet, blog ve iletişim sayfaları.',
    logoText: 'Furni',
    slogan: 'Modern Interior Design Studio',
    accent: '#3b5d50',
    featured: true,
    preview: {
      sky: '/Templates/furni-1.0.0/images/couch.png',
      tone: 'furni',
    },
    pages: [
      { id: 'index', name: 'Ana Sayfa', file: 'index.html', path: '/' },
      { id: 'shop', name: 'Mağaza', file: 'shop.html', path: '/shop' },
      { id: 'about', name: 'Hakkımızda', file: 'about.html', path: '/about' },
      { id: 'services', name: 'Hizmetler', file: 'services.html', path: '/services' },
      { id: 'blog', name: 'Blog', file: 'blog.html', path: '/blog' },
      { id: 'contact', name: 'İletişim', file: 'contact.html', path: '/contact' },
      { id: 'cart', name: 'Sepet', file: 'cart.html', path: '/cart' },
      { id: 'checkout', name: 'Ödeme', file: 'checkout.html', path: '/checkout' },
      { id: 'thankyou', name: 'Teşekkür', file: 'thankyou.html', path: '/thankyou' },
    ],
  },
]

export function getHtmlPack(id) {
  return HTML_PACKS.find((pack) => pack.id === id) || null
}

export function isHtmlPack(id) {
  return HTML_PACKS.some((pack) => pack.id === id)
}

export function htmlPackGalleryItems() {
  return HTML_PACKS.map((pack) => ({
    id: pack.id,
    category: pack.category,
    name: pack.name,
    title: pack.title,
    description: pack.description,
    logoText: pack.logoText,
    slogan: pack.slogan,
    accent: pack.accent,
    featured: Boolean(pack.featured),
    htmlPack: true,
    preview: pack.preview,
    pageCount: pack.pages.length,
    badges: ['HTML5', 'Multi Page', 'Studio Ready'],
  }))
}
