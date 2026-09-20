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

export {
    getAccounts,
}