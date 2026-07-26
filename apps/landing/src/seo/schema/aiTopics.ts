/**
 * AI Search semantic topics — natural on-page sections for LLM / AI Overview.
 * Keys match SEO_CONTENT paths.
 */
export type AiTopic = {
  heading: string
  body: string
}

export const AI_TOPICS: Record<string, AiTopic[]> = {
  '/crm': [
    {
      heading: 'CRM nedir?',
      body: 'CRM, müşteri ilişkilerini sistematik yönetme yöntemidir. BACHMAIN CRM; aday, fırsat, görev ve iletişim geçmişini tek kartta tutarak satış ekiplerinin kayıp lead riskini azaltır. WhatsApp CRM ve sosyal inbox ile aynı platformda çalışır.',
    },
    {
      heading: 'WhatsApp CRM ve dijital dönüşüm',
      body: 'Modern CRM yalnızca pipeline değildir. Mesajlaşma, saha ziyareti ve teklif süreci aynı veri modeline bağlandığında işletmeler Workflow Automation ve Digital Transformation adımlarını somutlaştırır.',
    },
  ],
  '/erp': [
    {
      heading: 'ERP nedir?',
      body: 'ERP, kaynakları ve operasyonu uçtan uca planlama yazılımıdır. BACHMAIN ERP; sipariş, stok, üretim ve finansı tek omurgada birleştirerek Business Intelligence ve raporlama için temiz veri üretir.',
    },
    {
      heading: 'B2B yönetimi ve operasyon',
      body: 'Bayi ve B2B siparişleri ERP kaydına bağlandığında stok rezervasyonu, üretim ve sevkiyat aynı süreç zincirinde ilerler. Tüm Süreçler Tek Platformda ilkesi burada görünür olur.',
    },
  ],
  '/muhasebe': [
    {
      heading: 'Ön muhasebe nedir?',
      body: 'Ön muhasebe; cari hareket, fatura ve tahsilatın günlük operasyonel takibidir. BACHMAIN muhasebe, finans ve e-fatura ile entegre çalışarak Excel dağınıklığını azaltır.',
    },
    {
      heading: 'Cari hesap takibi',
      body: 'Cari hesap takibi; müşteri ve tedarikçi bakiyelerini, vadeleri ve açık faturaları netleştirir. Doğru cari, finans ve nakit planının temelidir.',
    },
  ],
  '/e-fatura': [
    {
      heading: 'E-Fatura nedir?',
      body: 'E-Fatura, GİB kurallarına uygun elektronik faturadır. BACHMAIN e-fatura yaklaşımı; belgeyi sipariş, cari ve muhasebe kayıtlarıyla birlikte ele alarak uyum ve hızı bir arada tutmayı hedefler.',
    },
  ],
  '/uretim-takibi': [
    {
      heading: 'Üretim takibi nedir?',
      body: 'Üretim takibi; iş emri aşamalarının, sürelerin ve kalite noktalarının canlı izlenmesidir. BACHMAIN üretim takibi fotoğraflı süreç ve durum rayı ile şeffaflık sağlar.',
    },
  ],
  '/uretim': [
    {
      heading: 'Üretim yönetimi nasıl çalışır?',
      body: 'Üretim yönetimi; iş emri, malzeme ihtiyacı ve kapasite planını sipariş verisine bağlar. Depo çıkışı ve lojistik ile senkron olduğunda fire ve gecikme kontrolü kolaylaşır.',
    },
  ],
  '/depo': [
    {
      heading: 'Depo yönetimi nasıl yapılır?',
      body: 'Depo yönetimi; lokasyon, transfer, sayım ve rezervasyonu disiplinli yürütmektir. BACHMAIN depo modülü üretim çıkışı ve sevkiyat öncesi paketleme ile aynı stok modelini kullanır.',
    },
  ],
  '/stok': [
    {
      heading: 'Stok takibi neden önemlidir?',
      body: 'Stok takibi; satış sözü, üretim planı ve nakit bağını korur. Anlık bakiye ve kritik stok uyarıları olmadan sipariş karşılama riski artar. BACHMAIN stok, depo ve siparişle senkrondur.',
    },
  ],
  '/cari': [
    {
      heading: 'Cari hesap takibi',
      body: 'Cari hesap takibi alacak–borç dengesini görünür kılar. Ekstre, yaşlandırma ve tahsilat planı finans kararlarını hızlandırır; e-fatura ile belge bütünlüğü güçlenir.',
    },
  ],
  '/lojistik': [
    {
      heading: 'Lojistik yönetimi',
      body: 'Lojistik yönetimi; taşıma planı, rota ve teslim penceresini depo/sevkiyat ile hizalar. BACHMAIN lojistik, üretim sonrası ürünün müşteriye güvenli ulaşmasını hedefler.',
    },
  ],
  '/openai': [
    {
      heading: 'Yapay zeka destekli işletme yönetimi',
      body: 'Yapay zeka; özet, taslak ve asistan görevlerinde ekibi hızlandırır. BACHMAIN OpenAI yaklaşımı, AI’yı CRM/ERP verisinin yanında konumlandırarak Workflow Automation’a katkı sağlar.',
    },
  ],
  '/whatsapp': [
    {
      heading: 'WhatsApp CRM',
      body: 'WhatsApp CRM; iş yazışmalarını müşteri kartına bağlayan yaklaşımdır. BACHMAIN mesaj merkezinde konuşmalar ekipçe görünür; satış ve destek aynı geçmişi kullanır.',
    },
  ],
  '/sosyal-medya': [
    {
      heading: 'Sosyal medya yönetimi',
      body: 'Sosyal medya yönetimi; Instagram, Facebook, LinkedIn, X ve TikTok taleplerini tek inbox’ta toplamaktır. CRM eşlemesiyle sosyal etkileşim fırsata dönüşebilir.',
    },
  ],
  '/bayi': [
    {
      heading: 'B2B yönetimi',
      body: 'B2B yönetimi; bayi siparişi, fiyat listesi ve stok görünürlüğünü merkeze bağlar. BACHMAIN bayi portalı, dağıtım kanalını ERP/satış süreçleriyle bütünleştirir.',
    },
  ],
}

export function getAiTopics(path: string): AiTopic[] {
  return AI_TOPICS[path] || []
}
