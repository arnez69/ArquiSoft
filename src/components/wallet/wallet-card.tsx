"use client";

import { useState, useEffect } from "react";
import { Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft, RefreshCw, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils";
import type { WalletBalance, WalletTransaction } from "@/types/wallet";

export function WalletCard() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog/inline form states
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payRecipient, setPayRecipient] = useState("");

  const userId = "demo-user";

  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/wallbit?userId=${userId}`);
      if (!res.ok) throw new Error("Error cargando billetera");
      const data = await res.json();
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();

    // Listen for custom trigger payments from outside components (e.g. clicking "Pagar" on hospital card)
    const handleTriggerPayment = (e: Event) => {
      const customEvent = e as CustomEvent;
      setPayRecipient(customEvent.detail.hospitalName || "");
      setPayAmount("350"); // default emergency cost BOB
      setShowPayment(true);
      setShowDeposit(false);
      // scroll to wallet
      const element = document.getElementById("wallet-card-container");
      element?.scrollIntoView({ behavior: "smooth" });
    };

    window.addEventListener("trigger-wallet-payment", handleTriggerPayment);
    return () => {
      window.removeEventListener("trigger-wallet-payment", handleTriggerPayment);
    };
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(depositAmount);
    if (isNaN(amountVal) || amountVal <= 0 || !balance) return;

    setIsSubmitting(true);
    try {
      // Simulate deposit logic by adding to local state or sending mock request
      // (Wallbit client handles payments, we mock deposit locally for rich UX)
      const newBalance: WalletBalance = {
        ...balance,
        availableBalance: balance.availableBalance + amountVal,
        lastSyncedAt: new Date().toISOString(),
      };

      const newTx: WalletTransaction = {
        id: `tx_${Date.now()}`,
        userId,
        type: "deposit",
        amount: amountVal,
        currency: balance.currency,
        description: "Depósito / Recarga de emergencia",
        status: "completed",
        createdAt: new Date().toISOString(),
      };

      setBalance(newBalance);
      setTransactions((prev) => [newTx, ...prev]);
      setDepositAmount("");
      setShowDeposit(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0 || !payRecipient.trim() || !balance) return;

    if (amountVal > balance.availableBalance) {
      alert("Saldo insuficiente en tu billetera de emergencias.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/wallbit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: amountVal,
          currency: balance.currency,
          description: `Pago de Emergencia Médica: ${payRecipient}`,
          recipientAddress: payRecipient,
        }),
      });

      if (!res.ok) throw new Error("Error en pago de emergencia");
      
      const newBalance: WalletBalance = {
        ...balance,
        availableBalance: balance.availableBalance - amountVal,
        lastSyncedAt: new Date().toISOString(),
      };

      const newTx: WalletTransaction = {
        id: `tx_${Date.now()}`,
        userId,
        type: "withdrawal",
        amount: amountVal,
        currency: balance.currency,
        description: `Pago de Emergencia Médica: ${payRecipient}`,
        status: "completed",
        createdAt: new Date().toISOString(),
      };

      setBalance(newBalance);
      setTransactions((prev) => [newTx, ...prev]);
      setPayAmount("");
      setPayRecipient("");
      setShowPayment(false);
    } catch (err) {
      console.error(err);
      alert("Error al procesar el pago.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !balance) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-48 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-sana-600 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="wallet-card-container" className="shadow-lg border-sana-100 flex flex-col justify-between overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-sana-700 to-sana-800 text-white pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Wallet className="h-5 w-5" />
            Billetera de Emergencias
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchWalletData} 
            className="text-white hover:bg-sana-600/50"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription className="text-sana-100 text-xs">
          Módulo de pagos inmediatos respaldado por Wallbit API (BOB)
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-4 flex-1">
        {balance && (
          <div className="bg-sana-50/50 rounded-xl p-4 border border-sana-100 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Saldo Disponible
              </p>
              <p className="text-3xl font-extrabold text-sana-800 mt-1">
                {formatCurrency(balance.availableBalance, balance.currency)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Reservado: {formatCurrency(balance.reservedBalance, balance.currency)}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white border-sana-200 text-sana-700 text-xs flex gap-1 items-center"
                onClick={() => {
                  setShowDeposit(true);
                  setShowPayment(false);
                }}
              >
                <PlusCircle className="h-3.5 w-3.5 text-green-600" />
                Recargar
              </Button>
              <Button
                size="sm"
                className="bg-sana-600 hover:bg-sana-700 text-white text-xs flex gap-1 items-center"
                onClick={() => {
                  setShowPayment(true);
                  setShowDeposit(false);
                }}
              >
                <Send className="h-3.5 w-3.5" />
                Pagar
              </Button>
            </div>
          </div>
        )}

        {/* Deposit Form */}
        {showDeposit && (
          <form onSubmit={handleDeposit} className="border border-green-100 rounded-xl p-3 bg-green-50/20 space-y-2 animate-fadeIn">
            <h4 className="text-xs font-bold text-green-800">Recargar Saldo</h4>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Monto en BOB"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="text-xs border-green-200 focus-visible:ring-green-500 h-8"
                required
                min="10"
              />
              <Button 
                type="submit" 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 h-8 text-xs text-white"
                disabled={isSubmitting}
              >
                Confirmar
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs" 
                onClick={() => setShowDeposit(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {/* Payment Form */}
        {showPayment && (
          <form onSubmit={handlePayment} className="border border-sana-200 rounded-xl p-3 bg-sana-50/20 space-y-2 animate-fadeIn">
            <h4 className="text-xs font-bold text-sana-800">Pago de Emergencia Médica</h4>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Nombre del Hospital / Clínica"
                value={payRecipient}
                onChange={(e) => setPayRecipient(e.target.value)}
                className="text-xs border-sana-200 focus-visible:ring-sana-500 h-8"
                required
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Monto en BOB"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="text-xs border-sana-200 focus-visible:ring-sana-500 h-8 flex-1"
                  required
                  min="5"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="bg-sana-600 hover:bg-sana-700 h-8 text-xs text-white"
                  disabled={isSubmitting}
                >
                  Confirmar
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs" 
                  onClick={() => setShowPayment(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Recent Transactions */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
            Historial de Transacciones
          </h4>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No hay transacciones registradas.
              </p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white border border-sana-100 shadow-sm">
                  <div className="flex gap-2 items-center">
                    {tx.type === "deposit" ? (
                      <div className="bg-green-100 p-1.5 rounded-full text-green-700">
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="bg-red-100 p-1.5 rounded-full text-red-700">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800 max-w-[140px] truncate">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${tx.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
