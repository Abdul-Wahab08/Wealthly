import { AccountType } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";

async function getAccounts(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

    if (error) throw error;

    return data;
}

async function createAccount(supabase: SupabaseClient, userId: string, { name, type }: { name: string, type: AccountType }) {
    const { data, error } = await supabase
        .from('accounts')
        .insert({
            user_id: userId,
            name,
            type,
            balance: 0,
            is_default: false
        })
        .select()
        .single();

    if (error) throw error;

    return data;
}

async function setDefaultAccount(supabase: SupabaseClient, userId: string, accountId: string) {
    const { error: removeDefaultAccountError } = await supabase
        .from('accounts')
        .update({
            is_default: false
        })
        .eq('user_id', userId)
        .neq("id", accountId);

    if (removeDefaultAccountError) throw removeDefaultAccountError;

    const { error: setDefaultAccountError } = await supabase
        .from("accounts")
        .update({ is_default: true })
        .eq("id", accountId)

    if (setDefaultAccountError) throw setDefaultAccountError;
}

async function deleteAccount(supabase: SupabaseClient, accountId: string, { force = false }: { force?: boolean } = {}) {
    const { count, error: transactionCountError } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId);

    if (transactionCountError) throw transactionCountError;
    const transactionCount = count ?? 0;

    if (transactionCount > 0 && !force) return { isDeleted: false, transactionCount };

    const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId)

    if (error) throw error;

    return { isDeleted: true, transactionCount };
}

async function updateAccount(supabase: SupabaseClient, accountId: string, { name, type }: { name: string, type: AccountType }) {
    const { data, error } = await supabase
        .from('accounts')
        .update({
            name,
            type
        })
        .eq('id', accountId)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export {
    getAccounts,
    createAccount,
    setDefaultAccount,
    deleteAccount,
    updateAccount
}