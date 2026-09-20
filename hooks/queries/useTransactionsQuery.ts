import { useUser } from "@clerk/expo";
import { useSupabase } from "../useSupabase";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { getTransactions } from "@/lib/services/transactions";
import { TransactionFilters } from "@/types";

export function useTransactionsQuery(transactionFilters: TransactionFilters = {}) {
    const { user } = useUser();
    const supabase = useSupabase();

    return useQuery({
        queryKey: queryKeys.transactions(user!.id),
        queryFn: () => getTransactions(supabase, user!.id, transactionFilters),
        enabled: !!user,
    })
}