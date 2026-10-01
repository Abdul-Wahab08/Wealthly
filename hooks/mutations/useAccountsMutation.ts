import { useUser } from "@clerk/expo";
import { useSupabase } from "../useSupabase";
import { useMutation } from "@tanstack/react-query";
import { createAccount, deleteAccount, setDefaultAccount, updateAccount } from "@/lib/services/accounts";
import { AccountType } from "@/types";
import { queryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";

export function useCreateAccountMutation() {
    const { user } = useUser();
    const supabase = useSupabase();

    return useMutation({
        mutationFn: (payload: { name: string, type: AccountType }) => createAccount(supabase, user!.id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user!.id) }),
    })
}

export function useSetDefaultAccountMutation() {
    const { user } = useUser();
    const supabase = useSupabase();

    return useMutation({
        mutationFn: (accountId: string) => setDefaultAccount(supabase, user!.id, accountId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user!.id) }),
    })
}

export function useDeleteAccountMutation() {
    const { user } = useUser();
    const supabase = useSupabase();

    return useMutation({
        mutationFn: (
            { accountId, force }: { accountId: string, force?: boolean }
        ) => deleteAccount(supabase, accountId, { force }),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user!.id) })
            if (result.isDeleted) queryClient.invalidateQueries({ queryKey: queryKeys.transactions(user!.id) })
        }
    })
}

export function useUpdateAccountMutation() {
    const { user } = useUser();
    const supabase = useSupabase();

    return useMutation({
        mutationFn: ({ payload, accountId }: { payload: { name: string, type: AccountType }, accountId: string }) => updateAccount(supabase, accountId, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user!.id) }),
    })
}