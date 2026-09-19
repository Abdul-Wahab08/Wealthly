import { useSupabase } from "./useSupabase";
import { useUser } from "@clerk/expo";
import { useEffect } from "react";
import { userStore } from "../store/userStore";

export function useUserSync() {
    const { user } = useUser();
    const setCurrency = userStore((state) => state.setCurrency);
    const setNeedsOnboarding = userStore((state) => state.setNeedsOnboarding);
    const authClient = useSupabase();

    useEffect(() => {
        if (!user || !user.id) return;

        async function syncUser() {
            try {
                const { data: existingUser, error: existingUserError } = await authClient
                    .from("users")
                    .select("clerk_id, currency")
                    .eq("clerk_id", user?.id)
                    .single();

                if (existingUserError && existingUserError.code !== "PGRST116") {
                    console.error("Error fetching user ", existingUserError);
                    setNeedsOnboarding(true);
                    return;
                }

                if (existingUser) {
                    setCurrency(existingUser.currency);
                    setNeedsOnboarding(!existingUser.currency);
                    return;
                }

                const { data, error: upsertError } = await authClient
                    .from("users")
                    .upsert(
                        {
                            clerk_id: user?.id,
                            email: user?.emailAddresses[0].emailAddress,
                            name: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
                            image_url: user?.imageUrl,
                        },
                        {
                            onConflict: "clerk_id",
                            ignoreDuplicates: false,
                        }
                    )
                    .select("currency")
                    .single();

                if (upsertError) {
                    setNeedsOnboarding(true);
                    return;
                }

                setCurrency(data?.currency ?? "USD");
                setNeedsOnboarding(!data?.currency);

                const { error: insertAccountError } = await authClient
                    .from("accounts")
                    .insert({
                        user_id: user?.id,
                        name: "cash",
                        type: "CASH",
                        balance: 0,
                        is_default: true
                    })

                if (insertAccountError) {
                    console.error("Error inserting account ", insertAccountError);
                }
            } catch (error) {
                console.error("Error syncing user ", error);
                setNeedsOnboarding(true);
            }
        }

        syncUser();
    }, [user?.id]);
}