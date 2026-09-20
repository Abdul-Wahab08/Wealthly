import { useUser } from "@clerk/expo";
import { useSupabase } from "../useSupabase";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { getAccounts } from "@/lib/services/accounts";

export function useAccountsQuery() {
    const { user } = useUser();
    const supabase = useSupabase();

    return useQuery({
        queryKey: queryKeys.accounts(user!.id),
        queryFn: () => getAccounts(supabase, user!.id),
        enabled: !!user,
    })
}