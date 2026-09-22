import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "../useSupabase";
import { deleteTransaction } from "@/lib/services/transactions";
import { queryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";
import { useUser } from "@clerk/expo";

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