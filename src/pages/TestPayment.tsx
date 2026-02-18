
import React from 'react';
import PaymentQR from '@/components/PaymentQR';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TestPayment = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900">UPI Payment Test</h1>
                    <p className="text-slate-500">Generating QR for 8309223139</p>
                </div>

                <PaymentQR
                    upiId="8309223139@ybl"
                    payeeName="Founder (Test)"
                    amount={500}
                    note="Test Payment for Idea"
                    onPaymentComplete={() => alert('Payment Marked as Complete!')}
                />

                <div className="text-center">
                    <Button variant="ghost" onClick={() => navigate('/')}>
                        Back to Home
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TestPayment;
