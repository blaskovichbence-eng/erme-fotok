export interface CoinData {
  sorszam: number
  tervezo: string
  leiras: string
  dobozban: string
  csomagolas: string
  ev: string
  anyag: string
  suly: string
  meret: string
  megjegyzes: string
  ertekesitve: string
  elolap_link: string
  hatlap_link: string
  elolap_id: string
  hatlap_id: string
  doboz_kep_link: string
  doboz_kep_id: string
  egyeb_kep_link: string
  egyeb_kep_id: string
}

export interface SheetRow {
  values: string[]
}
