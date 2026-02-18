
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
        <Card className="w-full max-w-md mx-auto shadow-lg border-border">
            <CardHeader className="text-center">
                <CardTitle className="text-xl font-bold text-foreground">Scan to Pay</CardTitle>
                <CardDescription>Use any UPI app to complete the payment</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
                <div className="bg-black p-2 rounded-xl border border-border/60 shadow-inner text-white">
                    {qrCodeUrl ? (
                        <img src={qrCodeUrl} alt="UPI QR Code" className="w-64 h-64 object-contain" />
                    ) : (
                        <div className="w-64 h-64 bg-indigo-50 flex items-center justify-center text-slate-400">
                            QR Generation Failed
                        </div>
                    )}
                </div>

                <div className="text-center space-y-1 w-full p-4 bg-background rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Payee:</span>
                        <span className="font-medium text-foreground">{payeeName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">UPI ID:</span>
                        <span className="font-mono text-foreground">{upiId}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-border mt-2">
                        <span className="text-slate-700">Amount:</span>
                        <span className="text-primary">₹{amount.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* Mobile Deep Link Button */}
                <div className="text-center text-sm text-slate-500 md:hidden">
                    <p className="mb-2">On mobile? Tap below to pay directly</p>
                    <Button
                        variant="outline"
                        className="w-full"
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
                        Open UPI App
                    </Button>
                </div>

            </CardContent>
            <CardFooter>
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
