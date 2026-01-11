import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Rocket, CreditCard, Shield, Check, Zap } from "lucide-react";

const Payment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: "Payment Successful!",
      description: "You can now submit your ideas.",
    });

    // Store payment status in localStorage (demo purposes)
    localStorage.setItem("ideaSubscriptionPaid", "true");

    setIsProcessing(false);
    navigate("/founder-dashboard?showAddIdea=true");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Rocket className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-bold text-xl">INNOVESTOR</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
          {/* Pricing Card */}
          <Card className="glass border-0 h-fit">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Idea Submission Plan</CardTitle>
              <CardDescription>Unlock unlimited idea submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl text-muted-foreground line-through">₹1000/-</span>
                  <span className="text-5xl font-bold text-primary">₹199/-</span>
                </div>
                <p className="text-sm text-accent mt-2 font-medium">Limited Time Offer - 80% OFF!</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span>Unlimited idea submissions</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span>Direct chat with investors</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span>Priority visibility</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span>Analytics dashboard</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span>Lifetime access</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Shield className="w-4 h-4" />
                <span>Secure payment · 100% money-back guarantee</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
              <CardDescription>Enter your card details to complete payment</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Cardholder Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 16);
                      const formatted = value.replace(/(.{4})/g, "$1 ").trim();
                      setCardDetails({ ...cardDetails, cardNumber: formatted });
                    }}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                        const formatted = value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value;
                        setCardDetails({ ...cardDetails, expiry: formatted });
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      type="password"
                      maxLength={3}
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full h-12 text-lg" disabled={isProcessing}>
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <>Pay ₹199 Now</>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  By completing this payment, you agree to our Terms of Service
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Payment;
