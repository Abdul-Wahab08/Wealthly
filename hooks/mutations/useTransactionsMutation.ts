import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "../useSupabase";
import { createTransaction, deleteTransaction } from "@/lib/services/transactions";
import { queryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";
import { useUser } from "@clerk/expo";
import { TransactionType } from "@/types";

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
        mutationFn: ({ user_Id, ...payload }: any) => createTransaction(supabase, { user_id: user?.id, ...payload }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions(user!.id) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user!.id) })
        }
    })
}