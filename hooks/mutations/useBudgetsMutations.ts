import { setBudget } from "@/lib/services/budgets";
import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "../useSupabase";
import { useUser } from "@clerk/expo";
import { queryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";

export function useBudgetsMutations() {
    const supabase = useSupabase();
    const { user } = useUser();

    return useMutation({
        mutationFn: (amount: number) => setBudget(supabase, user!.id, amount),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.budgets(user!.id) }),
    })
}