export interface BankAccountRow {
  id: string;
  bankName: string;
  alias: string;
  accountNumber: string;
  clabe: string | null;
  currency: string;
  accountType: string;
  currentBalance: number;
  isActive: boolean;
  notes: string | null;
}

export interface TreasuryTransactionRow {
  id: string;
  bankAccountId: string;
  bankName: string;
  bankAlias: string;
  date: string;
  concept: string;
  type: string;
  amount: number;
  balance: number;
  reference: string | null;
  category: string | null;
  isReconciled: boolean;
  invoiceId: string | null;
}

export interface PettyCashFundRow {
  id: string;
  name: string;
  description: string | null;
  fundAmount: number;
  minimumBalance: number;
  active: boolean;
  custodianName: string | null;
  custodianEmail: string | null;
  lastAuditAt: string | null;
  lastAuditBalance: number | null;
  saldoDisponible: number;
  totalPendingExpenses: number;
  requiereReposicion: boolean;
}

export interface PettyCashExpenseRow {
  id: string;
  fundId: string;
  date: string;
  concept: string;
  amount: number;
  category: string;
  costCenter: string | null;
  receiptRef: string | null;
  status: string;
  xmlValidated: boolean;
  providerRfc: string | null;
}

export interface PettyCashReplenishmentRow {
  id: string;
  fundId: string;
  amount: number;
  requestedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  notes: string | null;
  status: string;
}

export interface TreasurySummary {
  totalBalance: number;
  ingresosMes: number;
  egresosMes: number;
  flujoNeto: number;
  accounts: BankAccountRow[];
}

export const TREASURY_CATEGORIES = [
  'NOMINA', 'PROVEEDOR', 'IMPUESTO', 'VENTA', 'INVERSION',
  'SERVICIOS', 'RENTA', 'CAJA_CHICA', 'TRANSFERENCIA', 'OTRO',
] as const;

export const PETTY_CASH_CATEGORIES = [
  'Papelería', 'Transporte', 'Viáticos', 'Limpieza',
  'Mensajería', 'Cafetería', 'Herramientas', 'Mantenimiento',
  'Servicios', 'Otros',
] as const;

export const ACCOUNT_TYPES = ['CHEQUES', 'AHORRO', 'INVERSION', 'NOMINA'] as const;
