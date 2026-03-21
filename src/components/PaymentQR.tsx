
import React, { useEffect, useState } from 'react';
import { generateUPIString, generateQRCode } from '@/lib/upi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentQRProps {
    upiId: string;
    payeeName: string;
    amount: number;
    note?: string;
    onPaymentComplete?: () => void;
}

const PaymentQR: React.FC<PaymentQRProps> = ({ upiId, payeeName, amount, note, onPaymentComplete }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [confirmed, setConfirmed] = useState<boolean>(false);

    useEffect(() => {
        const generate = async () => {
            setLoading(true);
            const upiString = generateUPIString({
                pa: upiId,
                pn: payeeName,
                am: amount.toString(),
                tn: note || 'Payment via INNOVESTOR',
            });
            const url = await generateQRCode(upiString);
            setQrCodeUrl(url);
            setLoading(false);
        };

        generate();
    }, [upiId, payeeName, amount, note]);

    const handleConfirm = () => {
        setConfirmed(true);
        if (onPaymentComplete) {
            onPaymentComplete();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent">
            <CardHeader className="text-center px-0 pt-0 pb-3">
                <CardTitle className="text-lg sm:text-xl font-bold text-foreground">Scan to Pay</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Use any UPI app to complete the payment</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4 px-0 pb-4">
                <div className="bg-black p-3 sm:p-4 rounded-2xl border border-border/60 shadow-inner w-full max-w-[220px] sm:max-w-[280px] flex justify-center">
                    {qrCodeUrl ? (
                        <img src={qrCodeUrl} alt="UPI QR Code" className="w-full aspect-square object-contain bg-white rounded-xl p-2" />
                    ) : (
                        <div className="w-full aspect-square bg-indigo-50 flex items-center justify-center text-slate-400 rounded-xl text-sm">
                            Gen Failed
                        </div>
                    )}
                </div>

                <div className="text-center space-y-1.5 w-full p-3 sm:p-4 bg-slate-50 border border-slate-100/50 rounded-xl">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-slate-500 whitespace-nowrap mr-2">Payee:</span>
                        <span className="font-medium text-foreground text-right">{payeeName}</span>
                    </div>
                    <div className="flex justify-between items-start sm:items-center text-xs sm:text-sm">
                        <span className="text-slate-500 whitespace-nowrap mr-2 mt-0.5 sm:mt-0">UPI ID:</span>
                        <span className="font-mono text-foreground break-all text-right">{upiId}</span>
                    </div>
                    <div className="flex justify-between items-center text-base sm:text-lg font-bold pt-2 border-t border-slate-200 mt-2">
                        <span className="text-slate-700">Amount:</span>
                        <span className="text-primary">₹{amount.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* Mobile Deep Link Button */}
                <div className="text-center w-full md:hidden pt-2">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="h-px bg-border flex-1" />
                        <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">OR</span>
                        <div className="h-px bg-border flex-1" />
                    </div>
                    <Button
                        variant="outline"
                        className="w-full bg-white shadow-sm h-11 border-slate-200 hover:bg-slate-50 text-brand-charcoal font-semibold"
                        onClick={() => {
                            const upiString = generateUPIString({
                                pa: upiId,
                                pn: payeeName,
                                am: amount.toString(),
                                tn: note || 'Payment via INNOVESTOR',
                            });
                            window.location.href = upiString;
                        }}
                    >
                        Pay directly with UPI App
                    </Button>
                </div>

            </CardContent>
            <CardFooter className="px-0 pb-0">
                {!confirmed ? (
                    <Button className="w-full" size="lg" onClick={handleConfirm}>
                        I have completed the payment
                    </Button>
                ) : (
                    <div className="flex items-center justify-center w-full gap-2 text-green-600 font-medium p-2 bg-green-50 rounded-lg border border-green-100">
                        <CheckCircle2 className="w-5 h-5" />
                        Payment Marked as Completed
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};

export default PaymentQR;
