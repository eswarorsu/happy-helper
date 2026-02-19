import { supabase } from "@/integrations/supabase/client";

export type SubmitAccessReason = "first_free" | "premium" | "payment_or_coupon" | "none";

export interface SubmitAccessResult {
    allowed: boolean;
    reason: SubmitAccessReason;
    unclaimedPaymentRecordId?: string;
}

export const ensurePremiumFlag = async (userId: string) => {
    const { data: successfulPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "success")
        .limit(1)
        .maybeSingle();

    if (successfulPayment) {
        await supabase
            .from("profiles")
            .update({ is_premium: true })
            .eq("user_id", userId);
    }
};

export const evaluateFounderSubmitAccess = async (profile: { id: string; user_id: string; is_premium?: boolean | null }): Promise<SubmitAccessResult> => {
    if (!profile?.id || !profile?.user_id) {
        return { allowed: false, reason: "none" };
    }

    if (profile.is_premium) {
        return { allowed: true, reason: "premium" };
    }

    const { data: successfulPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("status", "success")
        .limit(1)
        .maybeSingle();

    if (successfulPayment?.id) {
        await supabase
            .from("profiles")
            .update({ is_premium: true })
            .eq("user_id", profile.user_id);

        return { allowed: true, reason: "premium" as SubmitAccessReason };
    }

    const { count: ideasCount } = await supabase
        .from("ideas")
        .select("id", { count: "exact", head: true })
        .eq("founder_id", profile.id);

    if ((ideasCount ?? 0) === 0) {
        return { allowed: true, reason: "first_free" };
    }

    const { data: unclaimedPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("status", "success")
        .is("idea_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (unclaimedPayment?.id) {
        return {
            allowed: true,
            reason: "payment_or_coupon",
            unclaimedPaymentRecordId: unclaimedPayment.id
        };
    }

    return { allowed: false, reason: "none" };
};
