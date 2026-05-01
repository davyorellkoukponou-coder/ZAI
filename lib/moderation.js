// Lightweight word filter — FR + EN
// Conservative list covering slurs, threats and explicit insults

const BAD_WORDS = [
  // FR — insultes / menaces
  'connard', 'connasse', 'salope', 'pute', 'enculé', 'enculer',
  'pédé', 'tapette', 'bougnoule', 'négro', 'sale arabe', 'sale juif', 'sale noir',
  'je vais te tuer', 'je vais te buter', 'je vais te violer', 'crève', 'va te pendre',
  'suicide-toi', 'tue toi', 'tue-toi', 'va mourir',
  // EN — slurs / threats
  'kill yourself', 'kys', 'go die', 'i will kill you', 'i will rape',
  'nigger', 'nigga', 'faggot', 'retard', 'cunt', 'whore',
]

export function moderate(text) {
  if (!text) return { ok: true }

  // Normalize: remove accents, lowercase
  const t = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')

  for (const w of BAD_WORDS) {
    const norm = w
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
    if (t.includes(norm)) {
      return {
        ok: false,
        reason:
          'Ce message contient des termes non autorisés. Reformule sans insulter ni menacer.',
      }
    }
  }

  // Anti-spam: too many caps in a long text
  const letters = (text.match(/[A-Za-zÀ-ÿ]/g) || []).length
  const upper = (text.match(/[A-ZÀ-Þ]/g) || []).length
  if (letters > 20 && upper / letters > 0.7) {
    return { ok: false, reason: 'Évite tout en majuscules — ça fait crier.' }
  }

  // Anti-spam: repeated chars (aaaaaaaaaa)
  if (/(.)\1{9,}/.test(text)) {
    return { ok: false, reason: 'Trop de caractères répétés.' }
  }

  return { ok: true }
}
