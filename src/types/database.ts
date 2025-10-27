export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'admin' | 'manager' | 'cashier' | 'baker'
export type PaymentMode = 'cash' | 'card' | 'upi' | 'credit'
export type TransactionType = 'purchase' | 'sale' | 'production' | 'adjustment' | 'waste'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category_id: string | null
          sku: string | null
          barcode: string | null
          unit: string
          selling_price: number
          current_stock: number
          weighted_avg_cost: number
          reorder_level: number
          is_raw_material: boolean
          is_finished_good: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      sales: {
        Row: {
          id: string
          bill_number: string
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          subtotal: number
          discount_amount: number
          tax_amount: number
          total_amount: number
          payment_mode: PaymentMode
          notes: string | null
          sale_date: string
          created_by: string
          created_at: string
        }
      }
      sales_lines: {
        Row: {
          id: string
          sale_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount_percent: number
          line_total: number
          cost_price: number
          created_at: string
        }
      }
    }
  }
}
