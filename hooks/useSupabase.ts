import { createClerkSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@clerk/expo";
import { useMemo, useRef } from "react";

export function useSupabase() {
    const { getToken } = useAuth();
    const getTokenRef = useRef(getToken);
    getTokenRef.current = getToken;
    
    const client = useMemo(() => createClerkSupabaseClient(() => getTokenRef.current()), []);

    return client;
}