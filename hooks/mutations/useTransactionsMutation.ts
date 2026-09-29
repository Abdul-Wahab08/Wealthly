import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "../useSupabase";
import { createTransaction, deleteTransaction, startingBalanceTransaction } from "@/lib/services/transactions";
import { queryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";
import { useUser } from "@clerk/expo";
import { NewTransaction, TransactionType } from "@/types";

export function useDeleteTransaction() {
    const supabase = useSupabase();
    const { user } = useUser();

    return useMutation({
        mutationFn: (id: string) => deleteTransaction(supabase, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions(user!.id) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user!.id) })
        }
    })
}

export function useCreateTransaction() {
    const supabase = useSupabase();
    const { user } = useUser();

    return useMutation({
        mutationFn: (payload: NewTransaction) => createTransaction(supabase, payload),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions(user!.id) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user!.id) })
        }
    })
}

export function useStartingBalanceTransaction() {
    const supabase = useSupabase();

    return useMutation({
        mutationFn: (payload: NewTransaction) => startingBalanceTransaction(supabase, payload)
    })
}