import { TransactionFilters } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";

async function getTransactions(supabase: SupabaseClient, userId: string, transactionFilters: TransactionFilters = {}) {
    let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

    if (transactionFilters.type) query = query.eq('type', transactionFilters.type);
    if (transactionFilters.accountId) query = query.eq('account_id', transactionFilters.accountId);

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;

    return data;
}

export {
    getTransactions
}