export type NFZFeaturesCollection = {
  title: string
  description?: string
  url: string
  borderColor?: string
  fillColor?: string
  visible?: boolean
}

export type NFZDataset = {
  title: string
  description?: string
  url: string
  format: string
  countries: {
    code: string
    url?: string
    files: NFZFeaturesCollection[]
  }[]
}
