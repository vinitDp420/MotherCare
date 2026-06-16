import type { AuditFields } from './common.types'

export interface Medicine extends AuditFields {
  id: string
  name: string
  generic_name: string
  category: string
  category_display?: string
  unit: string
  reorder_level: number
  is_active: boolean
}

export interface MedicineBatch extends AuditFields {
  id: string
  medicine: string
  medicine_name?: string
  batch_number: string
  supplier_name: string
  purchase_date: string
  expiry_date: string
  quantity: number
  purchase_price: string // decimal string
  selling_price: string // decimal string
}

export interface PharmacySaleItem extends AuditFields {
  id: string
  sale: string
  medicine_batch: string
  medicine_name?: string
  batch_number?: string
  qty: number
  unit_price: string // decimal string
  line_total: string // decimal string
}

export interface PharmacySale extends AuditFields {
  id: string
  prescription?: string | null
  patient: string
  patient_name?: string
  patient_mrn?: string
  sold_by: string
  sold_by_name?: string
  invoice_number: string
  total_amount: string // decimal string
  sold_at: string
  items: PharmacySaleItem[]
}

export interface DispensePayload {
  prescription_id: string
}

export interface OtcSaleItemPayload {
  medicine_id: string
  qty: number
}

export interface OtcSalePayload {
  patient_id: string
  items: OtcSaleItemPayload[]
}

export interface CreateBatchPayload {
  medicine: string
  batch_number: string
  supplier_name: string
  purchase_date: string
  expiry_date: string
  quantity: number
  purchase_price: string
  selling_price: string
}
