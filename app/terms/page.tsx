import { getRequestLocale } from '@/lib/locale-server'
import { t } from '@/lib/locale'

export default async function TermsPage() {
  const locale = await getRequestLocale()

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-4xl font-bold">{t(locale, 'Terms of Service', 'Kullanim Kosullari')}</h1>
      <p className="mb-10 text-sm text-gray-500 dark:text-gray-400">
        {t(locale, 'Last updated: April 2025', 'Son güncelleme: Nisan 2025')}
      </p>

      <section className="prose prose-gray max-w-none space-y-8 text-gray-700 dark:text-gray-300">
        {locale === 'tr' ? (
          <>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1. Halisaha Hakkında</h2>
              <p>Halisaha, halı saha rezervasyonu yapmak isteyen oyuncular ile tesislerini platformda listeleyen saha sahiplerini buluşturan çevrim içi bir pazar yeridir. Rezervasyonlari kolaylaştıran teknolojiyi sağlarız; saha isletmecisi değiliz ve listelenen tesislerin sahibi ya da yöneticisi olmayiz.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2. Uygunluk</h2>
              <p>Hesap oluşturmak ve rezervasyon yapmak için en az 18 yaşında olmalısin. Kayıt olarak paylaştigin bilgilerin doğru ve güncel olduğunu onaylamis olursun.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">3. Rezervasyonlar ve İptaller</h2>
              <p>Rezervasyon talebi oluşturdugunda saha sahibi talebi inceler ve onaylar ya da reddeder. Rezervasyon yalnızca sahibin onayından sonra kesinlesir. Bekleyen veya onaylı rezervasyonlarini rezervasyonlar sayfandan iptal edebilirsin. Her sahanın iptal politikasi farklı olabilir; rezervasyon oncesi detaylari kontrol et.</p>
              <p className="mt-2">Halisaha, taraflardan birinin rezervasyonu reddetmesi veya iptal etmesinden kaynaklanan kayıplardan sorumlu değildir.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">4. Saha Sahipleri</h2>
              <p>Halisaha uzerinde tesis listeleyen saha sahipleri; fiyat, müsaitlik, adres ve fotoğraflar dahil olmak uzere ilan bilgilerinin doğrulugundan sorumludur. Tesislerin durumu ve güvenliği tamamen sahibin sorumlulugundadır. Halisaha, listelenen herhangi bir sahanın kalitesini denetlemez veya garanti etmez.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">5. Yasakli Davranislar</h2>
              <p>Sunlari yapmamayi kabul edersin:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Sahte hesaplar oluşturmak veya başkalarini taklit etmek</li>
                <li>Yanlis veya yaniltici ilan bilgileri girmek</li>
                <li>Platformu hukuka aykiri bir amacla kullanmak</li>
                <li>Hizmeti engellemeye veya bozmayi denemek</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">6. Sorumluluk</h2>
              <p>Halisaha platformu olduğu gibi sunulur. Platform uzerinden rezerve edilen tesislerde doğabilecek yaralanma, zarar veya kayıplardan sorumlu değiliz. Kullanıcılar ve saha sahipleri birbirleriyle kendi sorumlulukları altinda etkileşime girer.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">7. Hesap Askisi</h2>
              <p>Bu koşulları ihlal eden veya kötüye kullanildigini makul olarak dusundugumuz herhangi bir hesabi askiya alma ya da kapatma hakkimizi sakli tutariz.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">8. Koşullarda Değişiklik</h2>
              <p>Bu koşulları zaman zaman güncelleyebiliriz. Degisikliklerden sonra platformu kullanmaya devam etmen, güncel koşulları kabul ettigin anlamina gelir.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">9. Uygulanacak Hukuk</h2>
              <p>Bu kosullar uygulanabilir hukuka tabidir. Uyusmazliklar yetkili yargi mercilerinde cozulecektir.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">10. İletişim</h2>
              <p>Şartlar hakkındaki sorularin için <a href="mailto:hello@halisaha.com" className="text-black dark:text-white underline">hello@halisaha.com</a> adresinden bizimle iletişime geçebilirsin.</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1. About Halisaha</h2>
              <p>Halisaha is an online marketplace that connects players looking to book astroturf football pitches with pitch owners who list their venues on the platform. We provide the technology to facilitate bookings and do not own or manage any listed venue.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2. Eligibility</h2>
              <p>You must be at least 18 years old to create an account and make bookings. By registering, you confirm that the information you provide is accurate and up to date.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">3. Bookings and Cancellations</h2>
              <p>When you request a booking, the pitch owner reviews and approves or rejects it. A booking is only confirmed once the owner approves it. You may cancel a pending or confirmed booking through your reservations page. Cancellation policies for individual pitches may vary, so check the pitch details before booking.</p>
              <p className="mt-2">Halisaha is not responsible for losses arising from a booking being rejected or cancelled by either party.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">4. Pitch Owners</h2>
              <p>Pitch owners who list venues on Halisaha are responsible for the accuracy of their listing information, including pricing, availability, address, and photos. Owners are solely responsible for the condition and safety of their venues. Halisaha does not inspect or guarantee the quality of any listed pitch.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">5. Prohibited Conduct</h2>
              <p>You agree not to:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Create fake accounts or impersonate other people</li>
                <li>Submit false or misleading listing information</li>
                <li>Use the platform for any unlawful purpose</li>
                <li>Attempt to interfere with or disrupt the service</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">6. Liability</h2>
              <p>Halisaha provides the platform on an &quot;as is&quot; basis. We are not liable for injuries, damages, or losses that occur at any venue booked through the platform. Users and pitch owners engage with each other at their own risk.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">7. Account Suspension</h2>
              <p>We reserve the right to suspend or terminate any account that violates these terms or that we reasonably believe is being used abusively.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">8. Changes to These Terms</h2>
              <p>We may update these terms from time to time. Continued use of the platform after changes are posted constitutes your acceptance of the updated terms.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">9. Governing Law</h2>
              <p>These terms are governed by applicable law. Any disputes will be resolved in the appropriate jurisdiction.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">10. Contact</h2>
              <p>For questions about these terms, contact us at <a href="mailto:hello@halisaha.com" className="text-black dark:text-white underline">hello@halisaha.com</a>.</p>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
