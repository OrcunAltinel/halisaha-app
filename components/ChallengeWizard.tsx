'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useToast } from '@/components/ToastProvider'
import ChallengeSlotPicker from '@/components/ChallengeSlotPicker'
import { formatDateLabel, formatTime } from '@/lib/date-helpers'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

type Astroturf = {
  id: string
  name: string
  address: string
  location_name: string | null
  price_per_hour: number
}

type SelectedSlot = {
  id: string
  slot_date: string
  start_time: string
  end_time: string
}

type Props = {
  challengedTeamId: string
  challengedTeamName: string
  challengerTeamId: string
}

const supabase = createSupabaseBrowserClient()

export default function ChallengeWizard({ challengedTeamId, challengedTeamName, challengerTeamId }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const { locale } = useLocale()
  void challengerTeamId

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [turfs, setTurfs] = useState<Astroturf[]>([])
  const [turfsLoading, setTurfsLoading] = useState(true)
  const [selectedTurf, setSelectedTurf] = useState<Astroturf | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase
      .from('astroturf_list_view')
      .select('id, name, address, location_name, price_per_hour')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .then(({ data }) => {
        setTurfs((data ?? []) as Astroturf[])
        setTurfsLoading(false)
      })
  }, [])

  async function handleSend() {
    if (!selectedTurf || !selectedSlot) return
    setSending(true)

    const { error } = await supabase.rpc('send_challenge', {
      p_challenged_team_id: challengedTeamId,
      p_astroturf_id: selectedTurf.id,
      p_time_slot_id: selectedSlot.id,
      p_message: message.trim() || null,
    })

    setSending(false)

    if (error) {
      const msg =
        error.message === 'slot_not_available'
          ? t(locale, 'That slot is no longer available.', 'Bu saat artık müsait değil.')
          : error.message === 'slot_already_challenged'
          ? t(locale, 'Another team already has a pending challenge on that slot.', 'Baska bir takımın bu saat için zaten bekleyen bir meydan okumasi var.')
          : error.message === 'not_a_captain'
          ? t(locale, 'Only team captains can send challenges.', 'Yalnizca takım kaptanlari meydan okuma gönderebilir.')
          : error.message
      showToast(msg, 'error')
      return
    }

    showToast(t(locale, 'Challenge sent!', 'Meydan okuma gönderildi!'), 'success')
    router.push('/my-team')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {([t(locale, 'Pick a pitch', 'Saha seç'), t(locale, 'Pick a slot', 'Saat seç'), t(locale, 'Confirm', 'Onayla')].map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3
          const isActive = step === stepNum
          const isDone = step > stepNum
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className="h-px w-6 bg-gray-300 dark:bg-gray-700" />}
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition ${
                isActive
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : isDone
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                <span>{stepNum}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            </div>
          )
        }))}
      </div>

      {/* Step 1: Pick pitch */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t(locale, 'Choose a pitch', 'Bir saha seç')}
          </h2>
          {turfsLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t(locale, 'Loading pitches…', 'Sahalar yükleniyor…')}</p>
          ) : turfs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t(locale, 'No pitches available.', 'Müsait saha yok.')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {turfs.map((turf) => (
                <button
                  key={turf.id}
                  onClick={() => {
                    setSelectedTurf(turf)
                    setSelectedSlot(null)
                    setStep(2)
                  }}
                  className="rounded-2xl bg-white dark:bg-gray-900 p-5 text-left shadow-sm ring-1 ring-gray-100 dark:ring-gray-800 transition hover:shadow-md hover:ring-gray-900 dark:hover:ring-white"
                >
                  <div className="mb-3 h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{turf.name}</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {turf.location_name ?? turf.address}
                  </p>
                  <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                    {turf.price_per_hour} {t(locale, 'TL/hr', 'TL/saat')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Pick slot */}
      {step === 2 && selectedTurf && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              {t(locale, '← Back', '← Geri')}
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedTurf.name}
            </h2>
          </div>
          <ChallengeSlotPicker
            astroturfId={selectedTurf.id}
            pricePerHour={selectedTurf.price_per_hour}
            onSlotSelected={(slot) => {
              setSelectedSlot(slot)
              setStep(3)
            }}
          />
        </div>
      )}

      {/* Step 3: Message + confirm */}
      {step === 3 && selectedTurf && selectedSlot && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              {t(locale, '← Back', '← Geri')}
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t(locale, 'Confirm challenge', 'Meydan okumayı onayla')}</h2>
          </div>

          {/* Summary */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800 space-y-2 text-sm">
            <p>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{t(locale, 'Challenging:', 'Meydan okunacak takım:')}</span>{' '}
              <span className="text-gray-900 dark:text-white">{challengedTeamName}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{t(locale, 'Pitch:', 'Saha:')}</span>{' '}
              <span className="text-gray-900 dark:text-white">{selectedTurf.name}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{t(locale, 'When:', 'Ne zaman:')}</span>{' '}
              <span className="text-gray-900 dark:text-white">
                {formatDateLabel(selectedSlot.slot_date, locale)},{' '}
                {formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)}
              </span>
            </p>
          </div>

          {/* Optional message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t(locale, 'Message', 'Mesaj')} <span className="text-gray-400">({t(locale, 'optional', 'isteğe bağlı')})</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder={t(locale, 'Add a note to the opposing team…', 'Rakip takıma bir not ekle…')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
          >
            {sending ? t(locale, 'Sending…', 'Gönderiliyor…') : t(locale, 'Send challenge', 'Meydan okumayı gönder')}
          </button>
        </div>
      )}
    </div>
  )
}
