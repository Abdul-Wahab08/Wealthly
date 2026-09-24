import { NewTransaction, TransactionFilters, TransactionType } from "@/types";
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

async function deleteTransaction(supabase: SupabaseClient, transactionId: string) {
    const { data: transaction, error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .select('account_id, type, amount')
        .single()

    if (error) throw error;
    if (!transaction) throw new Error('Transaction not found');

    const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id, balance')
        .eq('id', transaction.account_id)
        .single()

    if (accountError) throw accountError;

    const amount = transaction.type === 'INCOME' ? -transaction.amount : transaction.amount

    const { error: updateError } = await supabase
        .from('accounts')
        .update({
            balance: account.balance + amount
        })
        .eq('id', account.id)

    if (updateError) throw updateError;

    return;
}

async function createTransaction(supabase: SupabaseClient, payload: NewTransaction) {
    const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();

    if (transactionError) return { transaction: null, error: transactionError };

    const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id, balance')
        .eq('id', transaction.account_id)
        .single();

    if (accountError) return { transaction, error: accountError };

    const delta = transaction.type === 'INCOME' ? transaction.amount : -transaction.amount;

    const { error: updateError } = await supabase
        .from('accounts')
        .update({
            balance: account.balance + delta
        })
        .eq('id', account.id)

    if (updateError) throw { transaction, error: updateError };
}

export {
    getTransactions,
    deleteTransaction,
    createTransaction
}