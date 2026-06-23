import CustomersPage from './CustomersPage'

export default function SuppliersPage() {
  return (
    <CustomersPage
      pageTitle="Tedarikçiler"
      createLabel="Yeni Tedarikçi Oluştur"
      listTitle="Tedarikçiler Listesi"
      totalLabel="Toplam Tedarikçi"
      columnLabel="Tedarikçi"
      emptyTitle="Tedarikçi bulunamadı."
      archiveModule="suppliers"
      listKind="supplier"
      createPath="/musteriler/yeni?kind=supplier"
    />
  )
}
