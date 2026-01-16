import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, ShieldCheck, CheckCircle2, ArrowRight, CreditCard, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Payment = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [upiId, setUpiId] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [paymentStarted, setPaymentStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

    // Timer logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (paymentStarted && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && paymentStarted) {
            setPaymentStarted(false);
            toast({
                title: "Payment Expired",
                description: "The payment window has closed. Please try again.",
                variant: "destructive"
            });
        }
        return () => clearInterval(timer);
    }, [paymentStarted, timeLeft, toast]);

    // Format time (600 -> 10:00)
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

    const handlePayment = () => {
        if (!isVerified) return;
        setPaymentStarted(true);

        // Simulate real-time payment completion
        setTimeout(() => {
            setIsProcessing(true);
            setTimeout(() => {
                navigate("/founder-dashboard?payment=success");
            }, 1500);
        }, 8000); // Redirect after 8 seconds of "waiting"
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fc] to-[#e2e8f0] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px] -ml-64 -mb-64" />
            </div>

            <div className="w-full max-w-lg relative z-10">
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
                    <CardHeader className="text-center pb-2">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Rocket className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight text-slate-900">
                            {paymentStarted ? "Awaiting Payment" : "Unlock Your Vision"}
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium mt-2">
                            {paymentStarted
                                ? "Please check your UPI app for the request"
                                : "Launch your next big idea on INNOVESTOR"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {paymentStarted ? (
                            <div className="space-y-8 py-4">
                                <div className="flex flex-col items-center justify-center p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] animate-pulse" />
                                    <div className="relative z-10 text-center">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Verification Sent to {upiId}</p>
                                        <div className="text-5xl font-black text-slate-900 tabular-nums">
                                            {formatTime(timeLeft)}
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Window closing soon</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                            <div className="w-5 h-5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Waiting for Confirmation</p>
                                            <p className="text-[11px] font-medium text-slate-500">Do not refresh or close this page</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setPaymentStarted(false)}
                                            className="flex-1 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Cancel Request
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3">
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 uppercase text-[10px] font-black tracking-widest">Special Offer</Badge>
                                    </div>

                                    <p className="text-slate-400 text-sm font-bold line-through mb-1">₹199/-</p>
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <span className="text-5xl font-black text-slate-900">₹99</span>
                                        <span className="text-slate-500 font-bold text-lg">/-</span>
                                    </div>
                                    <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest">Only for today</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        "Unlimited Visibility to Top Investors",
                                        "Direct Secured Chat Requests",
                                        "Real-time Analytics Dashboard",
                                        "Premium Founder Support"
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="bg-green-100 p-1 rounded-full">
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-600">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 space-y-4">
                                    <div className="space-y-2 text-left">
                                        <Label htmlFor="upi-id" className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
                                            Enter UPI ID
                                        </Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    id="upi-id"
                                                    placeholder="username@bank"
                                                    value={upiId}
                                                    onChange={(e) => {
                                                        setUpiId(e.target.value);
                                                        setIsVerified(false);
                                                    }}
                                                    className={`h-12 pl-10 bg-slate-50/50 border-slate-200 focus:ring-indigo-600 rounded-xl font-medium ${isVerified ? "border-green-500 bg-green-50/30" : ""}`}
                                                />
                                                {isVerified && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                onClick={handleVerify}
                                                disabled={isVerifying || isVerified || !upiId.includes("@")}
                                                variant="outline"
                                                className={`h-12 px-6 rounded-xl font-bold border-2 transition-all ${isVerified ? "border-green-500 text-green-600 bg-green-50" : "border-indigo-100 text-indigo-600 hover:bg-indigo-50"}`}
                                            >
                                                {isVerifying ? "..." : isVerified ? "Verified" : "Verify"}
                                            </Button>
                                        </div>
                                        {isVerified && (
                                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">
                                                UPI ID Verified Successfully
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handlePayment}
                                        disabled={isProcessing || !isVerified}
                                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xl shadow-indigo-100 text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {isProcessing ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Finalizing...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-5 h-5" />
                                                Make Payment
                                                <ArrowRight className="w-5 h-5 ml-1 opacity-50" />
                                            </div>
                                        )}
                                    </Button>

                                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <ShieldCheck className="w-4 h-4 text-green-500" />
                                        Secure SSL Encrypted Payment
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center mt-8 text-slate-400 text-xs font-medium">
                    By continuing, you agree to our Terms of Service and Refund Policy.
                </p>
            </div>
        </div>
    );
};

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs ${className}`}>
        {children}
    </span>
);

export default Payment;
