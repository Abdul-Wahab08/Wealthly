import { TransactionFilters } from "@/types";

export const queryKeys = {
    accounts: (userId: string)=> ['accounts', userId] as const,
    transactions: (userId: string, transactionFilters: TransactionFilters = {}) => ['transactions', userId, transactionFilters] as const,
    budgets: (userId: string) => ['budgets', userId] as const
};