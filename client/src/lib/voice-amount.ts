const VOICE_BASE = '/voice'

const CLIPS = {
  'da-nhan': `${VOICE_BASE}/da-nhan.mp3`,
  'dong': `${VOICE_BASE}/dong.mp3`,
  'nghin-dong': `${VOICE_BASE}/nghin-dong.mp3`,         // "nghìn đồng"
  'tram-nghin-dong': `${VOICE_BASE}/tram-nghin-dong.mp3`, // "trăm nghìn đồng"
  'chuc-nghin-dong': `${VOICE_BASE}/chuc-nghin-dong.mp3`, // "chục nghìn đồng"
  'trieu': `${VOICE_BASE}/trieu.mp3`,
  'tram': `${VOICE_BASE}/tram.mp3`,
  'muoi': `${VOICE_BASE}/muoi.mp3`,
  'muoi10': `${VOICE_BASE}/muoi10.mp3`,
  'khong': `${VOICE_BASE}/khong.mp3`,
  'mot': `${VOICE_BASE}/mot.mp3`,
  'mot1': `${VOICE_BASE}/mot1.mp3`,
  'hai': `${VOICE_BASE}/hai.mp3`,
  'ba': `${VOICE_BASE}/ba.mp3`,
  'bon': `${VOICE_BASE}/bon.mp3`,
  'nam': `${VOICE_BASE}/nam.mp3`,
  'lam': `${VOICE_BASE}/lam.mp3`,
  'sau': `${VOICE_BASE}/sau.mp3`,
  'bay': `${VOICE_BASE}/bay.mp3`,
  'tam': `${VOICE_BASE}/tam.mp3`,
  'chin': `${VOICE_BASE}/chin.mp3`,
  'le': `${VOICE_BASE}/le.mp3`,
} as const

type ClipKey = keyof typeof CLIPS

const DIGIT_CLIPS: ClipKey[] = ['khong', 'mot', 'hai', 'ba', 'bon', 'nam', 'sau', 'bay', 'tam', 'chin']

/**
 * Convert a 3-digit group (0-999) into clip keys.
 */
function threeDigitsToClips(hundreds: number, tens: number, units: number, skipLeadingZero: boolean): ClipKey[] {
  const clips: ClipKey[] = []

  if (hundreds > 0) {
    clips.push(DIGIT_CLIPS[hundreds])
    clips.push('tram')
  }

  if (tens === 0 && units > 0 && hundreds > 0) {
    clips.push('le')
    if (units === 1) clips.push('mot')
    else if (units === 5) clips.push('lam')
    else clips.push(DIGIT_CLIPS[units])
  } else if (tens === 1) {
    clips.push('muoi10')
    if (units === 1) clips.push('mot')
    else if (units === 5) clips.push('lam')
    else if (units > 0) clips.push(DIGIT_CLIPS[units])
  } else if (tens >= 2) {
    clips.push(DIGIT_CLIPS[tens])
    clips.push('muoi')
    if (units === 1) clips.push('mot1')
    else if (units === 5) clips.push('lam')
    else if (units > 0) clips.push(DIGIT_CLIPS[units])
  } else if (tens === 0 && units > 0 && hundreds === 0 && skipLeadingZero) {
    clips.push(DIGIT_CLIPS[units])
  }

  return clips
}

/**
 * Convert amount in VND to sequence of audio clip keys.
 * Supports 1,000đ to 19,999,000đ.
 * Uses compound endings: "nghìn đồng", "trăm nghìn đồng", "chục nghìn đồng".
 *
 * Examples:
 *   5,000   → đã nhận + năm + nghìn đồng
 *   50,000  → đã nhận + năm + chục nghìn đồng  (OR năm mươi nghìn đồng)
 *   500,000 → đã nhận + năm + trăm nghìn đồng
 *   21,000  → đã nhận + hai + mươi + một + nghìn đồng
 *   150,000 → đã nhận + một + trăm + năm + mươi + nghìn đồng (NOT using compound here)
 *   2,350,000 → đã nhận + hai + triệu + ba + trăm + năm + mươi + nghìn đồng
 */
export function amountToClips(amount: number): ClipKey[] {
  const clips: ClipKey[] = ['da-nhan']

  const thousands = Math.round(amount / 1000)

  if (thousands <= 0) {
    clips.push('khong')
    clips.push('dong')
    return clips
  }

  const millions = Math.floor(thousands / 1000)
  const remainingThousands = thousands % 1000

  // Millions part (1-19)
  if (millions > 0) {
    if (millions >= 10) {
      clips.push('muoi10')
      const mu = millions % 10
      if (mu === 5) clips.push('lam')
      else if (mu > 0) clips.push(DIGIT_CLIPS[mu])
    } else {
      clips.push(DIGIT_CLIPS[millions])
    }
    clips.push('trieu')
  }

  // Thousands part (0-999) + ending
  if (remainingThousands > 0) {
    const h = Math.floor(remainingThousands / 100)
    const t = Math.floor((remainingThousands % 100) / 10)
    const u = remainingThousands % 10

    // Simple compound cases (no millions prefix, exact match)
    if (millions === 0 && h > 0 && t === 0 && u === 0) {
      // X00,000 → "X trăm nghìn đồng"
      clips.push(DIGIT_CLIPS[h])
      clips.push('tram-nghin-dong')
      return clips
    }

    if (millions === 0 && h === 0 && t > 0 && u === 0) {
      // X0,000 → "X mươi nghìn đồng" or "mười nghìn đồng"
      if (t === 1) {
        clips.push('muoi10')
      } else {
        clips.push(DIGIT_CLIPS[t])
        clips.push('muoi')
      }
      clips.push('nghin-dong')
      return clips
    }

    if (millions === 0 && h === 0 && t === 0 && u > 0) {
      // X,000 → "X nghìn đồng"
      clips.push(DIGIT_CLIPS[u])
      clips.push('nghin-dong')
      return clips
    }

    // General case: build the thousands part, then add "nghìn đồng"
    if (millions > 0 && h === 0 && (t > 0 || u > 0)) {
      clips.push('khong')
      clips.push('tram')
      const sub = threeDigitsToClips(0, t, u, true)
      clips.push(...sub)
    } else {
      const sub = threeDigitsToClips(h, t, u, millions === 0)
      clips.push(...sub)
    }

    clips.push('nghin-dong')
    return clips
  }

  // Only millions, no thousands (e.g. 1,000,000)
  clips.push('dong')
  return clips
}

/**
 * Play a sequence of audio clips one after another.
 */
export async function playAmountVoice(amount: number): Promise<void> {
  const clipKeys = amountToClips(amount)

  for (const key of clipKeys) {
    const url = CLIPS[key]
    await new Promise<void>((resolve) => {
      const audio = new Audio(url)
      audio.volume = 1.0
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
  }
}
