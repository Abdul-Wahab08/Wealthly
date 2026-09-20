import { useUser } from "@clerk/expo";
import { useSupabase } from "../useSupabase";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { getBudgets } from "@/lib/services/budgets";

export function useBudgetsQuery() {
    const { user } = useUser();
    const supabase = useSupabase();

    return useQuery({
        queryKey: queryKeys.budgets(user!.id),
        queryFn: () => getBudgets(supabase, user!.id),
        enabled: !!user,
    })
}