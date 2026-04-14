import { getRequestLocale } from '@/lib/locale-server'
import { t } from '@/lib/locale'

export default async function PrivacyPage() {
  const locale = await getRequestLocale()

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-4xl font-bold">{t(locale, 'Privacy Policy', 'Gizlilik Politikasi')}</h1>
      <p className="mb-10 text-sm text-gray-500 dark:text-gray-400">{t(locale, 'Last updated: April 2025', 'Son güncelleme: Nisan 2025')}</p>

      <section className="prose prose-gray max-w-none space-y-8 text-gray-700 dark:text-gray-300">
        {locale === 'tr' ? (
          <>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1. Biz Kimiz</h2>
              <p>Halisaha, halı saha rezervasyonu için çevrim içi bir pazar yeri işletir. Bu politika hangi kişisel verileri topladığımızı, neden topladığımızı ve bu verileri KVKK dahil uygulanabilir veri koruma kurallarina uygun olarak nasıl işlediğimizi aciklar.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2. Topladıgimiz Veriler</h2>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li><strong>Hesap verileri:</strong> e-posta adresin ve şifren</li>
                <li><strong>Rezervasyon verileri:</strong> rezerve ettigin sahalar, tarihler, saatler ve rezervasyon durumu</li>
                <li><strong>Saha sahibi verileri:</strong> ilan başvurusunda paylaşilan saha adı, adres, foto, fiyat ve telefon</li>
                <li><strong>Kullanim verileri:</strong> hata ayiklama ve hizmet iyileştirme için standart sunucu kayıtlari</li>
              </ul>
              <p className="mt-3">Su anda aktif bir odeme sistemi olmadıgindan kart bilgisi toplamiyoruz.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">3. Neden Topluyoruz</h2>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Hesabini oluşturmak ve yönetmek için</li>
                <li>Rezervasyonlarini islemek ve saha sahiplerine göstermek için</li>
                <li>Saha sahiplerinin ilanlarini ve rezervasyonlarini yönetebilmesi için</li>
                <li>Platform kötüye kullanımini tespit etmek ve önlemek için</li>
                <li>Hizmeti zamanla iyileştirmek için</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">4. Kiminle Paylasiyoruz</h2>
              <p>Veri depolama ve kimlik doğrulama için <strong>Supabase</strong> kullanırız. Verilerin Supabase altyapısında tutulur ve onun gizlilik uygulamalarina tabidir. Verilerini satmayiz, reklam verenlerle paylaşmayiz ve üçüncü taraf takip scriptleri kullanmayiz.</p>
              <p className="mt-2">Rezervasyon yaptiginda saha sahibi rezervasyon detaylarini görür; e-posta adresini veya şifreni görmez.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">5. Saklama Suresi</h2>
              <p>Hesabin aktif olduğu sürece hesap ve rezervasyon verilerini saklariz. Hesap silme talebinde bulunursan, yasal zorunluluklar dışında kişisel verilerini 30 gün içinde sileriz.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">6. Haklarin (KVKK)</h2>
              <p>KVKK kapsaminda su haklara sahipsin:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Kisisel verilerinin islenip islenmedigini ogrenme</li>
                <li>Kisisel verilerine erisim talep etme</li>
                <li>Yanlis verilerin duzeltilmesini isteme</li>
                <li>Verilerinin silinmesini veya anonimlestirilmesini isteme</li>
                <li>Bazi durumlarda veri islemeye itiraz etme</li>
              </ul>
              <p className="mt-3">Bu haklari kullanmak için <a href="mailto:privacy@halisaha.com" className="text-black dark:text-white underline">privacy@halisaha.com</a> adresine yazabilirsin. 30 gün içinde yanıt veririz.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">7. Çerezler</h2>
              <p>Giriş yapmış kalman için tek bir oturum çerezi kullanırız. Reklam çerezleri veya üçüncü taraf takip çerezleri kullanmayiz.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">8. Politikadaki Degisiklikler</h2>
              <p>Platform geliştikçe bu politikayi güncelleyebiliriz. Güncel sürümü burada yayınlarız. Degisikliklerden sonra platformu kullanmaya devam etmen, güncel politikayi kabul ettigin anlamina gelir.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">9. İletişim</h2>
              <p>Gizlilik veya veri talepleri için <a href="mailto:privacy@halisaha.com" className="text-black dark:text-white underline">privacy@halisaha.com</a> adresinden bize ulaşabilirsin.</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1. Who We Are</h2>
              <p>Halisaha operates an online marketplace for booking astroturf football pitches. This policy explains what personal data we collect, why we collect it, and how we handle it in accordance with applicable data protection law, including Turkey&apos;s Law on the Protection of Personal Data.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2. Data We Collect</h2>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li><strong>Account data:</strong> your email address and password</li>
                <li><strong>Booking data:</strong> the pitches you book, dates, times, and booking status</li>
                <li><strong>Pitch owner data:</strong> pitch name, address, photos, price, and phone number submitted through the listing application</li>
                <li><strong>Usage data:</strong> standard server logs for debugging and service improvement</li>
              </ul>
              <p className="mt-3">We do not collect payment card details because no payment processing is active at this time.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">3. Why We Collect It</h2>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>To create and manage your account</li>
                <li>To process and display your bookings to pitch owners</li>
                <li>To allow pitch owners to manage their listings and reservations</li>
                <li>To detect and prevent abuse of the platform</li>
                <li>To improve the service over time</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">4. Who We Share It With</h2>
              <p>We use <strong>Supabase</strong> to store data and manage authentication. Your data is stored in Supabase infrastructure and governed by its privacy practices. We do not sell your data, share it with advertisers, or use third-party tracking scripts.</p>
              <p className="mt-2">When you make a booking, the pitch owner sees your reservation details but not your email address or password.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">5. How Long We Keep It</h2>
              <p>We retain your account and booking data for as long as your account is active. If you request account deletion, we will delete your personal data within 30 days except where retention is legally required.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">6. Your Rights (KVKK)</h2>
              <p>Under KVKK, you have rights including access, correction, deletion, and objection in certain circumstances.</p>
              <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:privacy@halisaha.com" className="text-black dark:text-white underline">privacy@halisaha.com</a>.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">7. Cookies</h2>
              <p>We use a single session cookie to keep you logged in. We do not use advertising cookies or third-party tracking cookies.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">8. Changes to This Policy</h2>
              <p>We may update this policy as the platform evolves. We will post the updated version here with a revised date. Continued use of the platform after changes are posted means you accept the updated policy.</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">9. Contact</h2>
              <p>For privacy-related questions or data requests, contact us at <a href="mailto:privacy@halisaha.com" className="text-black dark:text-white underline">privacy@halisaha.com</a>.</p>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
