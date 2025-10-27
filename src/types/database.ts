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
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      // Add other table types as needed
    }
  }
}
