import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, CreditCard, Wallet, Ticket } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { useToast } from "@/hooks/use-toast";
import { couponLimiter, orderLimiter } from "@/lib/rateLimiter";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://happy-helper.onrender.com";

const Payment = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [upiId, setUpiId] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const [paymentStarted, setPaymentStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600);

    const [couponCode, setCouponCode] = useState("");
    const [isCouponValid, setIsCouponValid] = useState(false);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

    // Initialise Cashfree
    const [cashfree, setCashfree] = useState<any>(null);

    useEffect(() => {
        const initCashfree = () => {
            if ((window as any).Cashfree) {
                // Use VITE_ prefix for frontend, or fallback to the non-VITE one if available (though VITE will only expose VITE_ ones)
                const appId = import.meta.env.VITE_CASHFREE_APP_ID || "122873434dc75ad61ff8d7406124378221";
                console.log("Initializing Cashfree with AppID:", appId);
                setCashfree((window as any).Cashfree({ mode: "production" }));
            } else {
                console.warn("Cashfree window object not found yet, retrying...");
            }
        };

        // Try immediately
        initCashfree();

        // Also try on a small delay in case script is still loading
        const timer = setTimeout(initCashfree, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Handle return from Cashfree
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get("order_id");
        if (orderId) {
            verifyPayment(orderId);
        }
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (paymentStarted && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (timeLeft === 0 && paymentStarted) {
            setPaymentStarted(false);
            toast({ title: "Payment Expired", description: "The payment window has closed. Please try again.", variant: "destructive" });
        }
        return () => clearInterval(timer);
    }, [paymentStarted, timeLeft, toast]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Helper function to get auth headers
    const getAuthHeaders = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error("Not authenticated");
        }
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
        };
    };

    // FORMAT CHECK ONLY 
    const UPI_REGEX = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,30}$/;

    const handleVerify = () => {
        if (!UPI_REGEX.test(upiId.trim())) {
            toast({
                title: "Invalid UPI Format",
                description: "Please enter a valid UPI ID (e.g. yourname@upi or 9876543210@paytm).",
                variant: "destructive",
            });
            return;
        }
        setIsVerified(true);
        toast({
            title: "UPI Format Accepted",
            description: "Format looks correct. Proceed to pay — your bank will confirm on checkout.",
        });
    };

    const handleValidateCoupon = async () => {
        if (!couponCode.trim()) return;

        if (!couponLimiter.allow()) {
            toast({ title: "Too many attempts", description: couponLimiter.retryMessage(), variant: "destructive" });
            return;
        }

        setIsValidatingCoupon(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        const code = couponCode.toUpperCase().trim();

        try {
            // @ts-ignore
            const { data: success, error } = await supabase.rpc('redeem_coupon', { coupon_code: code });

            if (error) {
                console.error("Coupon RPC Error:", error);
                toast({ title: "System Error", description: "Could not verify coupon limit. Please contact support.", variant: "destructive" });
                setIsValidatingCoupon(false);
                return;
            }

            if (success) {
                setIsCouponValid(true);
                setIsValidatingCoupon(false);
                toast({ title: "Coupon Applied! 🎉", description: "Access granted! Redirecting..." });
                setIsProcessing(true);

                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        await (supabase as any).from("payments").insert({
                            user_id: session.user.id,
                            razorpay_order_id: `COUPON_${code}_${Date.now()}`,
                            razorpay_payment_id: `FREE_${Date.now()}`,
                            razorpay_signature: "COUPON_REDEMPTION",
                            amount: 0,
                            status: "success",
                            verified_at: new Date().toISOString()
                        });

                        await (supabase as any)
                            .from("profiles")
                            .update({ is_premium: true })
                            .eq("user_id", session.user.id);
                    }
                    navigate("/submit-idea?coupon=" + code);
                } catch (err) {
                    console.error("Payment Record Error:", err);
                    toast({ title: "Error", description: "Failed to record transaction.", variant: "destructive" });
                    setIsProcessing(false);
                }
            } else {
                setIsValidatingCoupon(false);
                toast({ title: "Invalid or Limit Reached", description: "This coupon is invalid or has reached its usage limit.", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            setIsValidatingCoupon(false);
            toast({ title: "Error", description: "Something went wrong validating the coupon.", variant: "destructive" });
        }
    };

    const verifyPayment = async (orderId: string) => {
        setIsProcessing(true);
        try {
            const verifyHeaders = await getAuthHeaders();
            const verifyRes = await fetch(`${BACKEND_URL}/api/payment/verify`, {
                method: "POST",
                headers: verifyHeaders,
                body: JSON.stringify({ order_id: orderId }),
            });

            const result = await verifyRes.json();

            if (result.success) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await (supabase as any).from("payments").insert({
                        user_id: session.user.id,
                        order_id: orderId,
                        amount: 1,
                        status: "success",
                        payment_gateway: "cashfree",
                        verified_at: new Date().toISOString()
                    });

                    await (supabase as any)
                        .from("profiles")
                        .update({ is_premium: true })
                        .eq("user_id", session.user.id);
                }
                toast({ title: "Payment Successful 🎉", description: "Redirecting to submit your idea..." });
                navigate("/submit-idea?order_id=" + orderId);
            } else {
                toast({ title: "Payment Failed", description: "Verification failed or payment pending", variant: "destructive" });
            }
        } catch (error) {
            console.error("Payment verification error:", error);
            toast({ title: "Verification Error", description: "Please contact support", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayment = async () => {
        if (!isVerified) return;

        if (!orderLimiter.allow()) {
            toast({ title: "Too many attempts", description: orderLimiter.retryMessage(), variant: "destructive" });
            return;
        }

        setIsProcessing(true);

        try {
            const headers = await getAuthHeaders();

            const res = await fetch(`${BACKEND_URL}/api/payment/create-order`, {
                method: "POST",
                headers,
                body: JSON.stringify({ amount: 1 }), // ₹1 as requested
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to create order");
            }

            const order = await res.json();

            if (!order.payment_session_id) {
                throw new Error("Invalid order response from server: missing payment_session_id");
            }

            if (cashfree) {
                cashfree.checkout({
                    paymentSessionId: order.payment_session_id,
                    redirectTarget: "_self" 
                });
            } else {
                throw new Error("Cashfree SDK not loaded. Please refresh the page.");
            }

        } catch (error) {
            console.error("Payment error:", error);
            toast({
                title: "Payment Error",
                description: error instanceof Error ? error.message : "Something went wrong",
                variant: "destructive"
            });
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-lg relative z-10">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate("/founder-dashboard")}
                    className="mb-6 text-slate-500 hover:text-slate-700"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>

                <Card className="border border-slate-200 shadow-xl bg-white rounded-3xl text-slate-900 overflow-hidden">
                    <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-6">
                            <Logo size="md" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-[#111827] tracking-tight">
                            {paymentStarted ? "Awaiting Payment" : "Unlock Your Vision"}
                        </CardTitle>
                        <CardDescription className="text-slate-500 mt-2 font-medium">
                            {paymentStarted ? "Please check your UPI app for the request" : "Launch your next big idea on INNOVESTOR"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-4">
                        {paymentStarted ? (
                            <div className="space-y-6 py-4">
                                <div className="flex flex-col items-center justify-center p-8 bg-background rounded-2xl border border-border">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                        Verification Sent to {upiId}
                                    </p>
                                    <div className="text-5xl font-bold text-[#111827] tabular-nums">
                                        {formatTime(timeLeft)}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-medium">Window closing soon</p>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                        <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Waiting for Confirmation</p>
                                        <p className="text-xs text-slate-500">Do not refresh or close this page</p>
                                    </div>
                                </div>

                                <Button variant="ghost" onClick={() => setPaymentStarted(false)} className="w-full text-slate-400 hover:text-slate-600">
                                    Cancel Request
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Pricing Box */}
                                <div className="bg-background rounded-2xl p-8 text-center border border-border relative">
                                    <div className="absolute top-4 right-4">
                                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                            Special Offer
                                        </Badge>
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium line-through mb-1">₹499/-</p>
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <span className="text-4xl font-bold text-[#111827]">₹1</span>
                                        <span className="text-slate-500 font-medium text-lg">/-</span>
                                    </div>
                                    <p className="text-slate-500 font-medium text-xs uppercase tracking-wider">Launch fee</p>
                                </div>

                                {/* Features */}
                                <div className="space-y-3">
                                    {[
                                        "Unlimited Visibility to Top Investors",
                                        "Direct Secured Chat Requests",
                                        "Real-time Analytics Dashboard",
                                        "Premium Founder Support"
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* UPI Input */}
                                <div className="space-y-3 pt-4">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Enter UPI ID
                                    </Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                placeholder="username@bank"
                                                value={upiId}
                                                onChange={(e) => { setUpiId(e.target.value); setIsVerified(false); }}
                                                className={`h-11 pl-10 bg-white border-slate-300 rounded-lg text-slate-900 ${isVerified ? "border-emerald-500 bg-emerald-50/50" : ""}`}
                                            />
                                            {isVerified && (
                                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                                            )}
                                        </div>
                                        <Button
                                            onClick={handleVerify}
                                            disabled={isVerified || !upiId.includes("@")}
                                            variant="outline"
                                            className={`h-11 px-5 rounded-lg font-semibold border-2 ${isVerified ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "border-border text-slate-700 hover:bg-background"}`}
                                        >
                                            {isVerified ? "Accepted" : "Check Format"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Pay Button */}
                                <Button
                                    onClick={handlePayment}
                                    disabled={isProcessing || !isVerified || isCouponValid}
                                    className="w-full h-12 bg-gradient-to-r from-[#6366F1] to-[#818CF8] hover:from-[#4F46E5] hover:to-[#6366F1] text-white rounded-full shadow-sm text-base font-semibold disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-5 h-5" />
                                            Make Payment
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                        </div>
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    Secure SSL Encrypted Payment
                                </div>

                                {/* Divider */}
                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-border" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            Or use a coupon
                                        </span>
                                    </div>
                                </div>

                                {/* Coupon Section */}
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                placeholder="Enter coupon code"
                                                value={couponCode}
                                                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setIsCouponValid(false); }}
                                                className={`h-11 pl-10 bg-white border-slate-300 rounded-lg uppercase text-slate-900 ${isCouponValid ? "border-emerald-500 bg-emerald-50/50" : ""}`}
                                                disabled={isProcessing}
                                            />
                                            {isCouponValid && (
                                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                                            )}
                                        </div>
                                        <Button
                                            onClick={handleValidateCoupon}
                                            disabled={isValidatingCoupon || isCouponValid || !couponCode.trim() || isProcessing}
                                            variant="outline"
                                            className={`h-11 px-5 rounded-lg font-semibold border-2 ${isCouponValid ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "border-border text-slate-700 hover:bg-background"}`}
                                        >
                                            {isValidatingCoupon ? "..." : isCouponValid ? "Valid" : "Apply"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center mt-6 text-slate-400 text-xs font-medium">
                    By continuing, you agree to our{" "}
                    <a href="/terms" className="underline hover:text-slate-600">Terms of Service</a> and{" "}
                    <a href="/refund" className="underline hover:text-slate-600">Refund Policy</a>.
                </p>
            </div>
        </div>
    );
};

export default Payment;
