export type FundStatus = 'Funding' | 'Funded' | 'Closed'

export type FundPreview = {
  title: string
  purpose: string
  raised: string
  target: string
  deadline: string
  contributors: number
  status: FundStatus
}
