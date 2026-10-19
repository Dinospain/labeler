export type Label = {
    id: number
    productName: string
    weight?: string | null
    composition?: string | null
    proteins100g?: number | null
    fats100g?: number | null
    carbs100g?: number | null
    standard?: string | null
    shelfLife?: string | null
    manufacturedAt?: string | null
    packagedAt?: string | null
    expiresAt?: string | null
    address?: string | null
    mchsInfo?: string | null
    website?: string | null
    barcode?: string | null
    barcodeType?: string | null
    folderId?: number | null
    createdAt?: string
    updatedAt?: string
}

export type Folder = {
    id: number
    name: string
    accountId?: number
    createdAt?: string
    _count?: { labels: number }
}

export type Template = {
    id: number
    name: string
    html: string
    isCurrent: boolean
    createdAt?: string
    updatedAt?: string
}

// Тело POST/PUT /api/labels: даты — YYYY-MM-DD, пустые значения — null
export type LabelPayload = {
    productName?: string
    weight?: string | null
    composition?: string | null
    proteins100g?: number | null
    fats100g?: number | null
    carbs100g?: number | null
    standard?: string | null
    shelfLife?: string | null
    manufacturedAt?: string | null
    packagedAt?: string | null
    expiresAt?: string | null
    address?: string | null
    mchsInfo?: string | null
    website?: string | null
    barcode?: string | null
    folderId?: number | null
}
