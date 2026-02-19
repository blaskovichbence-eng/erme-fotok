export const createSlug = (text: string, maxLength: number = 25): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, maxLength)
}

export const createFileName = (
  serialNumber: number,
  description: string,
  side: 'A' | 'B' | 'D' | 'E'
): string => {
  const slug = createSlug(description, 25)
  const paddedNumber = String(serialNumber).padStart(4, '0')
  return `${paddedNumber}_${slug}_${side}.jpg`
}

export const getFolderName = (serialNumber: number): string => {
  const lower = Math.floor((serialNumber - 1) / 50) * 50 + 1
  const upper = lower + 49
  return `${String(lower).padStart(4, '0')}-${String(upper).padStart(4, '0')}`
}
