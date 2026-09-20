import { SupabaseClient } from "@supabase/supabase-js";

async function getBudgets(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;

    return data;
}

async function setBudget(supabase: SupabaseClient, userId: string, amount: number) {
    const { data, error } = await supabase
        .from('budgets')
        .upsert({
            user_id: userId,
            amount: amount
        },
            {
                onConflict: 'user_id'
            })
        .select()
        .single()

    if (error) throw error;

    return data;
}

export {
    getBudgets,
    setBudget,
}