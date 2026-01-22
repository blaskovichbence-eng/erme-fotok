export interface CoinData {
  sorszam: number
  tervezoSorszam: number
  tervezo: string
  leiras: string
  dobozban: string
  csomagolas: string
  ertekesitve: string
  ev: string
  anyag: string
  suly: string
  meret: string
  megjegyzes: string
  kategoria: string
  elolap_link: string
  hatlap_link: string
  elolap_id: string
  hatlap_id: string
}

export interface SheetRow {
  values: string[]
}
