import { SupabaseClient } from "@supabase/supabase-js";

export async function updateCurrency(supabase: SupabaseClient, userId: string, currency: string) {
    const { error } = await supabase
        .from("users")
        .update({ currency })
        .eq("clerk_id", userId);

    if (error) throw error;
}