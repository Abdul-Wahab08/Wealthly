import { useUser } from "@clerk/expo";
import { useSupabase } from "../useSupabase";
import { updateCurrency } from "@/lib/services/updateCurrency";
import { useMutation } from "@tanstack/react-query";

export function useUpdateCurrency() {
    const supabase = useSupabase();
    const { user } = useUser();

    return useMutation({
        mutationFn: (currencyCode: string) => updateCurrency(supabase, user!.id, currencyCode),
    })
}