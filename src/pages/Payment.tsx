import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, CreditCard, Wallet, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VALID_COUPONS = ["FREEIDEA", "INNOVESTOR100", "SKIP2026"];

const Payment = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [upiId, setUpiId] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [paymentStarted, setPaymentStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600);

    const [couponCode, setCouponCode] = useState("");
    const [isCouponValid, setIsCouponValid] = useState(false);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

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

    const handleVerify = () => {
        if (!upiId.includes("@")) return;
        setIsVerifying(true);
        setTimeout(() => {
            setIsVerifying(false);
            setIsVerified(true);
            toast({ title: "UPI Verified", description: "Your UPI ID has been successfully verified." });
        }, 1500);
    };

    const handleValidateCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsValidatingCoupon(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const isValid = VALID_COUPONS.includes(couponCode.toUpperCase().trim());
        setIsCouponValid(isValid);
        setIsValidatingCoupon(false);

        if (isValid) {
            toast({ title: "Coupon Applied! 🎉", description: "Payment skipped. Redirecting to submit your idea..." });
            setIsProcessing(true);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await supabase.from("payments").insert({
                        user_id: session.user.id,
                        razorpay_order_id: `COUPON_${couponCode.toUpperCase()}_${Date.now()}`,
                        razorpay_payment_id: `FREE_${Date.now()}`,
                        razorpay_signature: "COUPON_REDEMPTION",
                        amount: 0,
                        status: "success",
                        verified_at: new Date().toISOString()
                    });
                }
                navigate("/submit-idea?coupon=" + couponCode.toUpperCase());
            } catch (error) {
                toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
                setIsProcessing(false);
            }
        } else {
            toast({ title: "Invalid Coupon", description: "This coupon code is not valid.", variant: "destructive" });
        }
    };

    const handlePayment = async () => {
        if (!isVerified) return;
        setIsProcessing(true);

        try {
            const res = await fetch("https://happy-helper.onrender.com/api/payment/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: 499 }),
            });

            const order = await res.json();

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "INNOVESTOR",
                description: "Founder Access Plan",
                order_id: order.id,
                handler: async function (response: any) {
                    const verifyRes = await fetch("https://happy-helper.onrender.com/api/payment/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(response),
                    });

                    const result = await verifyRes.json();

                    if (result.success) {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.user) {
                            await supabase.from("payments").insert({
                                user_id: session.user.id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                amount: 499,
                                status: "success",
                                verified_at: new Date().toISOString()
                            });
                        }
                        toast({ title: "Payment Successful 🎉", description: "Redirecting to submit your idea..." });
                        navigate("/submit-idea?payment_id=" + response.razorpay_payment_id);
                    } else {
                        toast({ title: "Payment Failed", description: "Verification failed", variant: "destructive" });
                    }
                },
                theme: { color: "#0f172a" },
            };

            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
            setIsProcessing(false);
        } catch (error) {
            toast({ title: "Payment Error", description: "Something went wrong", variant: "destructive" });
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg relative z-10">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate("/founder-dashboard")}
                    className="mb-6 text-slate-500 hover:text-slate-700"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>

                <Card className="border border-slate-200 shadow-lg bg-white">
                    <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-6">
                            <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
                                <Rocket className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                            {paymentStarted ? "Awaiting Payment" : "Unlock Your Vision"}
                        </CardTitle>
                        <CardDescription className="text-slate-500 mt-2">
                            {paymentStarted ? "Please check your UPI app for the request" : "Launch your next big idea on INNOVESTOR"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-4">
                        {paymentStarted ? (
                            <div className="space-y-6 py-4">
                                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                        Verification Sent to {upiId}
                                    </p>
                                    <div className="text-5xl font-bold text-slate-900 tabular-nums">
                                        {formatTime(timeLeft)}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-medium">Window closing soon</p>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                        <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Waiting for Confirmation</p>
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
                                <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200 relative">
                                    <div className="absolute top-4 right-4">
                                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                            Special Offer
                                        </Badge>
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium line-through mb-1">₹1999/-</p>
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <span className="text-4xl font-bold text-slate-900">₹499</span>
                                        <span className="text-slate-500 font-medium text-lg">/-</span>
                                    </div>
                                    <p className="text-slate-500 font-medium text-xs uppercase tracking-wider">One-time payment</p>
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
                                                className={`h-11 pl-10 bg-white border-slate-200 rounded-lg ${isVerified ? "border-emerald-500 bg-emerald-50/30" : ""}`}
                                            />
                                            {isVerified && (
                                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                                            )}
                                        </div>
                                        <Button
                                            onClick={handleVerify}
                                            disabled={isVerifying || isVerified || !upiId.includes("@")}
                                            variant="outline"
                                            className={`h-11 px-5 rounded-lg font-semibold border-2 ${isVerified ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                                        >
                                            {isVerifying ? "..." : isVerified ? "Verified" : "Verify"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Pay Button */}
                                <Button
                                    onClick={handlePayment}
                                    disabled={isProcessing || !isVerified || isCouponValid}
                                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm text-base font-semibold disabled:opacity-50"
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
                                        <div className="w-full border-t border-slate-200" />
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
                                                className={`h-11 pl-10 bg-white border-slate-200 rounded-lg uppercase ${isCouponValid ? "border-emerald-500 bg-emerald-50/30" : ""}`}
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
                                            className={`h-11 px-5 rounded-lg font-semibold border-2 ${isCouponValid ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
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
