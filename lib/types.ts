// Tipos do banco de dados (espelham as migrações em supabase/migrations).
// Mantenha este arquivo em sincronia caso o schema seja alterado.

export type ProductCategory =
  | "cerveja"
  | "refrigerante"
  | "agua"
  | "suco"
  | "vinho"
  | "destilado"
  | "outros";

export type ProductUnit =
  | "unidade"
  | "pack6"
  | "pack12"
  | "fardo"
  | "garrafa"
  | "lata";

export type PaymentMethod = "dinheiro" | "pix" | "debito" | "credito";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          distributor_name: string;
          low_stock_threshold: number;
          created_at: string;
        };
        Insert: {
          id: string;
          distributor_name?: string;
          low_stock_threshold?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          distributor_name?: string;
          low_stock_threshold?: number;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: ProductCategory;
          sale_price: number;
          cost_price: number;
          stock_quantity: number;
          unit: ProductUnit;
          min_stock: number;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          category: ProductCategory;
          sale_price: number;
          cost_price?: number;
          stock_quantity?: number;
          unit: ProductUnit;
          min_stock?: number;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: ProductCategory;
          sale_price?: number;
          cost_price?: number;
          stock_quantity?: number;
          unit?: ProductUnit;
          min_stock?: number;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          user_id: string;
          customer_name: string | null;
          payment_method: PaymentMethod;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          customer_name?: string | null;
          payment_method: PaymentMethod;
          total?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          customer_name?: string | null;
          payment_method?: PaymentMethod;
          total?: number;
          created_at?: string;
        };
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Update: {
          id?: string;
          sale_id?: string;
          product_id?: string;
          product_name?: string;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_sale: {
        Args: {
          p_customer_name: string | null;
          p_payment_method: PaymentMethod;
          p_items: { product_id: string; quantity: number }[];
        };
        Returns: string;
      };
      get_dashboard_summary: {
        Args: Record<string, never>;
        Returns: {
          revenue_today: number;
          revenue_week: number;
          revenue_month: number;
          low_stock_count: number;
        }[];
      };
      get_low_stock_products: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          name: string;
          stock_quantity: number;
          min_stock: number;
          unit: ProductUnit;
        }[];
      };
      get_sales_last_7_days: {
        Args: Record<string, never>;
        Returns: { sale_date: string; total: number }[];
      };
      get_top_products: {
        Args: {
          p_start: string;
          p_end: string;
          p_category: ProductCategory | null;
        };
        Returns: {
          product_id: string;
          product_name: string;
          total_quantity: number;
          total_revenue: number;
        }[];
      };
      get_report_summary: {
        Args: {
          p_start: string;
          p_end: string;
          p_category: ProductCategory | null;
        };
        Returns: {
          total_revenue: number;
          total_cost: number;
          total_profit: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}

// Tipos auxiliares usados nos componentes
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Sale = Database["public"]["Tables"]["sales"]["Row"];
export type SaleItem = Database["public"]["Tables"]["sale_items"]["Row"];

export type DashboardSummary =
  Database["public"]["Functions"]["get_dashboard_summary"]["Returns"][number];

export type DailySales =
  Database["public"]["Functions"]["get_sales_last_7_days"]["Returns"][number];

export type LowStockProduct =
  Database["public"]["Functions"]["get_low_stock_products"]["Returns"][number];

export type TopProduct =
  Database["public"]["Functions"]["get_top_products"]["Returns"][number];

export type ReportSummary =
  Database["public"]["Functions"]["get_report_summary"]["Returns"][number];
