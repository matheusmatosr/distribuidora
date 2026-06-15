# StockBebidas

Sistema de gestão de estoque e vendas para distribuidoras de bebidas.
Permite cadastrar produtos com foto, controlar o estoque com alertas de
nível mínimo, registrar vendas em um PDV simples e acompanhar o desempenho
do negócio com dashboard e relatórios de faturamento, custo e lucro.

## Funcionalidades

- Dashboard com indicadores de vendas e alertas de estoque baixo
- Cadastro de produtos com foto, categoria, preço e estoque mínimo
- PDV para registrar vendas com múltiplas formas de pagamento
- Controle de estoque com lista de compras sugerida
- Relatórios filtráveis por período e categoria
- Exportação de dados em CSV
- Alerta diário por e-mail para produtos com estoque baixo

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI**: componentes próprios no estilo shadcn/ui (sem dependência do Radix)
- **Gráficos**: Recharts
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **E-mail de alerta**: Resend
