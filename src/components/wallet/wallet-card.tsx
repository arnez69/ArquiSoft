"use client";

import { useState, useEffect } from "react";
import {
  Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft, RefreshCw, Send,
  QrCode, UserCheck, TrendingUp, CheckCircle2, Camera, AlertTriangle, Info
} from "lucide-react";
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

  // Simulated Wallbit account states (persisted in localStorage for convenience)
  const [isAccountActive, setIsAccountActive] = useState(false);
  const [isInvestmentActive, setIsInvestmentActive] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0); // 0: input, 1: verifying, 2: success

  // KYC form state
  const [kycName, setKycName] = useState("");
  const [kycId, setKycId] = useState("");

  // Dialog/inline form states
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payRecipient, setPayRecipient] = useState("");

  // QR Simulator state
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrScanSuccess, setQrScanSuccess] = useState(false);
  const [scannedData, setScannedData] = useState<{ recipient: string; amount: number } | null>(null);
  const [qrTab, setQrTab] = useState<'show' | 'scan'>('show');

  const userId = "demo-user";

  // Load Wallbit state from local storage or defaults
  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      const active = localStorage.getItem("wallbit_account_active") === "true";
      const invest = localStorage.getItem("wallbit_investment_active") === "true";
      setIsAccountActive(active);
      setIsInvestmentActive(invest);

      const res = await fetch(`/api/wallbit?userId=${userId}`);
      if (!res.ok) throw new Error("Error cargando billetera");
      const data = await res.json();

      // Override balance with localStorage if exists
      const savedBalance = localStorage.getItem("wallbit_available_balance");
      const currentBalance = savedBalance ? parseFloat(savedBalance) : data.balance.availableBalance;

      setBalance({
        ...data.balance,
        availableBalance: currentBalance
      });

      // Load transactions
      const savedTxs = localStorage.getItem("wallbit_transactions");
      if (savedTxs) {
        setTransactions(JSON.parse(savedTxs));
      } else {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();

    // Listen for custom trigger payments (e.g. clicking pay in clinics card)
    const handleTriggerPayment = (e: Event) => {
      const customEvent = e as CustomEvent;
      setPayRecipient(customEvent.detail.hospitalName || "");
      setPayAmount("350"); // default BOB
      setShowPayment(true);
      setShowDeposit(false);
      setShowQRScanner(false);

      const element = document.getElementById("wallet-card-container");
      element?.scrollIntoView({ behavior: "smooth" });
    };

    window.addEventListener("trigger-wallet-payment", handleTriggerPayment);
    return () => {
      window.removeEventListener("trigger-wallet-payment", handleTriggerPayment);
    };
  }, []);

  // Simulate KYC Activation Process
  const handleStartActivation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycName.trim() || !kycId.trim()) return;

    setIsVerifying(true);
    setVerificationStep(1);

    // Step-by-step verification animation
    setTimeout(() => {
      setVerificationStep(2); // verifying check
      setTimeout(() => {
        setIsAccountActive(true);
        setIsInvestmentActive(true);
        localStorage.setItem("wallbit_account_active", "true");
        localStorage.setItem("wallbit_investment_active", "true");
        setIsVerifying(false);
        setVerificationStep(0);

        // Notify user
        alert("¡Cuenta de Wallbit y Perfil de Inversión activados con éxito!");
      }, 1500);
    }, 1550);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(depositAmount);
    if (isNaN(amountVal) || amountVal <= 0 || !balance) return;

    setIsSubmitting(true);
    try {
      const newBalVal = balance.availableBalance + amountVal;

      const newBalance: WalletBalance = {
        ...balance,
        availableBalance: newBalVal,
        lastSyncedAt: new Date().toISOString(),
      };

      const newTx: WalletTransaction = {
        id: `tx_${Date.now()}`,
        userId,
        type: "deposit",
        amount: amountVal,
        currency: balance.currency,
        description: "Depósito de emergencia (Wallbit)",
        status: "completed",
        createdAt: new Date().toISOString(),
      };

      const updatedTxs = [newTx, ...transactions];

      // Persist in localStorage
      localStorage.setItem("wallbit_available_balance", newBalVal.toString());
      localStorage.setItem("wallbit_transactions", JSON.stringify(updatedTxs));

      setBalance(newBalance);
      setTransactions(updatedTxs);
      setDepositAmount("");
      setShowDeposit(false);

      if (amountVal < 350) {
        alert(`Depósito exitoso. Nota: Has fondeado ${amountVal} BOB. Recuerda que el fondeo mínimo recomendado para activar completamente la tarjeta virtual e inversiones es de 350 BOB (50 USD).`);
      } else {
        alert(`¡Cuenta Fondeada con éxito! Has superado el mínimo requerido (350 BOB). Tu billetera de emergencias está activa y funcional.`);
      }
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
      alert("Saldo insuficiente en tu billetera de emergencias Wallbit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newBalVal = balance.availableBalance - amountVal;
      const newBalance: WalletBalance = {
        ...balance,
        availableBalance: newBalVal,
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

      const updatedTxs = [newTx, ...transactions];

      localStorage.setItem("wallbit_available_balance", newBalVal.toString());
      localStorage.setItem("wallbit_transactions", JSON.stringify(updatedTxs));

      setBalance(newBalance);
      setTransactions(updatedTxs);
      setPayAmount("");
      setPayRecipient("");
      setShowPayment(false);
      alert(`Pago de ${formatCurrency(amountVal, balance.currency)} a ${payRecipient} procesado exitosamente por Wallbit.`);
    } catch (err) {
      console.error(err);
      alert("Error al procesar el pago.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // QR Code Simulator handlers
  const handleQRScan = () => {
    setShowQRScanner(true);
    setQrScanSuccess(false);

    // Simulate camera scanning after 2 seconds
    setTimeout(() => {
      setQrScanSuccess(true);
      setScannedData({
        recipient: "Clínica San Gabriel - Urgencias Médicas",
        amount: 350
      });
    }, 2000);
  };

  const handleConfirmQRPayment = () => {
    if (!scannedData || !balance) return;

    if (scannedData.amount > balance.availableBalance) {
      alert("Saldo insuficiente. Por favor realiza un fondeo en tu cuenta Wallbit.");
      return;
    }

    setIsSubmitting(true);
    const newBalVal = balance.availableBalance - scannedData.amount;
    const newBalance: WalletBalance = {
      ...balance,
      availableBalance: newBalVal,
      lastSyncedAt: new Date().toISOString(),
    };

    const newTx: WalletTransaction = {
      id: `tx_qr_${Date.now()}`,
      userId,
      type: "withdrawal",
      amount: scannedData.amount,
      currency: balance.currency,
      description: `Pago QR: ${scannedData.recipient}`,
      status: "completed",
      createdAt: new Date().toISOString(),
    };

    const updatedTxs = [newTx, ...transactions];

    localStorage.setItem("wallbit_available_balance", newBalVal.toString());
    localStorage.setItem("wallbit_transactions", JSON.stringify(updatedTxs));

    setBalance(newBalance);
    setTransactions(updatedTxs);
    setShowQRScanner(false);
    setQrScanSuccess(false);
    setScannedData(null);
    setIsSubmitting(false);
    alert("¡Pago QR en USD/BOB liquidado con éxito por Wallbit!");
  };

  const resetAllSimulations = () => {
    localStorage.removeItem("wallbit_account_active");
    localStorage.removeItem("wallbit_investment_active");
    localStorage.removeItem("wallbit_available_balance");
    localStorage.removeItem("wallbit_transactions");
    fetchWalletData();
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

  // Define if the account is functional (active + funded minimum 350 BOB)
  const isFullyFunctional = isAccountActive && isInvestmentActive && (balance?.availableBalance ?? 0) >= 350;

  return (
    <Card id="wallet-card-container" className="shadow-lg border-sana-100 flex flex-col justify-between overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-sana-700 to-sana-800 text-white pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Wallet className="h-5 w-5" />
            Billetera de Emergencias Wallbit
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchWalletData}
              className="text-white hover:bg-sana-650 h-8 w-8"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllSimulations}
              className="text-[10px] text-white/90 hover:text-white border border-white/20 hover:bg-white/10 px-2 h-7"
            >
              Reiniciar Demo
            </Button>
          </div>
        </div>
        <CardDescription className="text-sana-100 text-xs">
          Cuenta virtual en USD e Inversiones líquidas de Emergencia (Bolivia Sandbox)
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-4 flex-1">
        {/* Step 1: Verification / Activation Panel */}
        {!isAccountActive || !isInvestmentActive ? (
          <div className="border border-dashed border-sana-250 rounded-xl p-4 bg-sana-50/10 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Activación Requerida de Wallbit</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Para utilizar la billetera de emergencia médica, debes verificar tu cuenta de inversiones.
                </p>
              </div>
            </div>

            {verificationStep === 0 && (
              <form onSubmit={handleStartActivation} className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nombre Completo"
                    value={kycName}
                    onChange={(e) => setKycName(e.target.value)}
                    className="text-xs h-8 border-sana-200"
                    required
                  />
                  <Input
                    placeholder="Documento de Identidad (CI)"
                    value={kycId}
                    onChange={(e) => setKycId(e.target.value)}
                    className="text-xs h-8 border-sana-200"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-sana-600 hover:bg-sana-700 text-xs text-white py-1.5 h-8 font-bold"
                >
                  Activar Cuenta de Inversión Wallbit
                </Button>
              </form>
            )}

            {verificationStep === 1 && (
              <div className="flex flex-col items-center py-4 space-y-2">
                <RefreshCw className="h-6 w-6 text-sana-650 animate-spin" />
                <p className="text-[10px] text-muted-foreground font-semibold animate-pulse">
                  Verificando KYC & Apertura de Cuenta de Inversión Brokerage...
                </p>
              </div>
            )}

            {verificationStep === 2 && (
              <div className="flex flex-col items-center py-4 space-y-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-bounce" />
                <p className="text-[10px] text-emerald-650 font-bold">
                  ¡Cuenta e Inversiones Habilitadas!
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Account active, show statuses & balances */
          <div className="space-y-4">
            {/* Account Status Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-350 border border-emerald-200 dark:border-emerald-900">
                <UserCheck className="h-3 w-3" />
                Cuenta Wallbit Activa
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-850 dark:bg-indigo-950 dark:text-indigo-350 border border-indigo-200 dark:border-indigo-900">
                <TrendingUp className="h-3 w-3" />
                Cuenta de Inversión Activa
              </span>

              {isFullyFunctional ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-800 border border-green-200">
                  Billetera Viva & Funcional
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Fondeo Mínimo Pendiente (350 BOB)
                </span>
              )}
            </div>

            {/* Balances Display */}
            {balance && (
              <div className="bg-sana-50/50 dark:bg-slate-950/40 rounded-xl p-4 border border-sana-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                    Saldo de Inversión Disponible
                  </p>
                  <p className="text-3xl font-extrabold text-sana-850 dark:text-sana-400 mt-1">
                    {formatCurrency(balance.availableBalance, balance.currency)}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3 text-slate-400" />
                    Mínimo requerido para transaccionar: 350 BOB (~$50 USD)
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white border-sana-200 hover:bg-sana-50 text-sana-700 text-xs flex gap-1 items-center h-8"
                    onClick={() => {
                      setShowDeposit(true);
                      setShowPayment(false);
                      setShowQRScanner(false);
                    }}
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-green-600" />
                    Recargar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-sana-600 hover:bg-sana-700 text-white text-xs flex gap-1 items-center h-8"
                    disabled={!isFullyFunctional}
                    onClick={() => {
                      setShowPayment(true);
                      setShowDeposit(false);
                      setShowQRScanner(false);
                    }}
                    title={!isFullyFunctional ? "Requiere fondear el mínimo de 350 BOB para habilitar pagos" : ""}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Pagar Online
                  </Button>
                </div>
              </div>
            )}
            {/* QR Payment Code Button */}
            <div className="pt-1">
              <Button
                onClick={() => {
                  setShowQRScanner(true);
                  setQrTab('show');
                  setQrScanSuccess(false);
                  setScannedData(null);
                }}
                disabled={!isFullyFunctional}
                className="w-full bg-sana-600 hover:bg-sana-700 dark:bg-sana-700 dark:hover:bg-sana-600 text-white text-xs py-2 shadow-md flex gap-2 items-center justify-center rounded-xl font-bold h-10 transition-all"
                title={!isFullyFunctional ? "Requiere fondear el mínimo de 350 BOB para habilitar pagos QR" : ""}
              >
                <QrCode className="h-4 w-4" />
                Pagar Clínicas con Código QR (USD/BOB)
              </Button>
            </div>
          </div>
        )}

        {/* QR Scanner / Generator Simulator */}
        {showQRScanner && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950/50 space-y-3 animate-fadeIn">
            {/* Tab selection */}
            <div className="flex gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
              <button
                type="button"
                className={`text-[11px] flex-1 py-1.5 rounded-lg font-bold transition-all ${qrTab === 'show'
                  ? 'bg-sana-600 text-white shadow-xs'
                  : 'text-slate-650 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-900'
                  }`}
                onClick={() => {
                  setQrTab('show');
                  setQrScanSuccess(false);
                  setScannedData(null);
                }}
              >
                Presentar mi QR de Pago
              </button>
              <button
                type="button"
                className={`text-[11px] flex-1 py-1.5 rounded-lg font-bold transition-all ${qrTab === 'scan'
                  ? 'bg-sana-600 text-white shadow-xs'
                  : 'text-slate-650 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-900'
                  }`}
                onClick={() => {
                  setQrTab('scan');
                  handleQRScan();
                }}
              >
                Escanear QR de Clínica
              </button>
            </div>

            {qrTab === 'show' ? (
              <div className="flex flex-col items-center justify-center p-2 text-center space-y-3">
                <div className="p-3.5 bg-white rounded-xl border border-slate-150 shadow-xs flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=wallbit_payment_350_bob"
                    alt="QR de Pago Wallbit"
                    className="w-36 h-36 object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Código QR de Pago Virtual</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Monto Pre-autorizado: 350,00 BOB</p>
                  <p className="text-[9.5px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Muestra este código QR en la caja del hospital. El personal médico lo escaneará para debitar el copago directamente desde tu cuenta Wallbit.
                  </p>
                </div>

                {qrScanSuccess && scannedData ? (
                  <div className="p-3 w-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded-lg space-y-2 text-left animate-fadeIn">
                    <p className="text-[9px] text-emerald-850 dark:text-emerald-450 uppercase font-bold tracking-wider">Solicitud de Débito Recibida</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{scannedData.recipient}</p>
                    <p className="text-xs text-muted-foreground">Importe: <span className="font-bold text-foreground">{formatCurrency(scannedData.amount, balance?.currency || "BOB")}</span></p>
                    <Button
                      onClick={handleConfirmQRPayment}
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs text-white py-1.5 h-8 font-bold"
                    >
                      Aprobar Débito QR
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setScannedData({
                        recipient: "Débito por Hospital del Norte (Urgencias)",
                        amount: 350
                      });
                      setQrScanSuccess(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-[10px] text-white py-1 h-8 font-bold w-full rounded-xl transition-all"
                  >
                    Simular Escaneo por la Clínica
                  </Button>
                )}
              </div>
            ) : (
              /* Camera Scanning flow */
              <div>
                {!qrScanSuccess ? (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 h-32 rounded-xl bg-slate-100/50 dark:bg-slate-900/30">
                    <QrCode className="h-8 w-8 text-slate-400 animate-pulse" />
                    <p className="text-[10px] text-muted-foreground mt-2 font-medium">Buscando código QR de la clínica...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 rounded-lg space-y-1">
                      <p className="text-[9px] text-emerald-800 dark:text-emerald-450 uppercase font-bold tracking-wider">Código QR de Clínica Detectado</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{scannedData?.recipient}</p>
                      <p className="text-xs text-muted-foreground">Monto Clínico: <span className="font-bold text-foreground">{scannedData ? formatCurrency(scannedData.amount, balance?.currency || "BOB") : ""}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleConfirmQRPayment}
                        disabled={isSubmitting}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs text-white py-1.5 h-8 font-bold"
                      >
                        Confirmar Pago QR
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowQRScanner(false);
                          setQrScanSuccess(false);
                          setScannedData(null);
                        }}
                        className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs h-8"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* General Close button */}
            {(!qrScanSuccess || qrTab === 'show') && (
              <Button
                variant="outline"
                onClick={() => {
                  setShowQRScanner(false);
                  setQrScanSuccess(false);
                  setScannedData(null);
                }}
                className="w-full border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 text-xs h-8 rounded-xl font-medium"
              >
                Cerrar
              </Button>
            )}
          </div>
        )}

        {/* Deposit Form */}
        {showDeposit && (
          <form onSubmit={handleDeposit} className="border border-green-100 rounded-xl p-3 bg-green-50/20 space-y-2 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-green-800">Recargar Saldo Wallbit</h4>
              <span className="text-[9px] font-bold text-green-700 bg-green-100/50 px-1.5 py-0.5 rounded">Mínimo sugerido: 350 BOB</span>
            </div>
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
            <h4 className="text-xs font-bold text-sana-850">Pago de Emergencia Médica Online</h4>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Nombre del Hospital / Clínica / Farmacia"
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
            Historial de Transacciones Wallbit
          </h4>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No hay transacciones registradas.
              </p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-sana-100 dark:border-slate-800 shadow-xs">
                  <div className="flex gap-2 items-center">
                    {tx.type === "deposit" ? (
                      <div className="bg-green-150 p-1.5 rounded-full text-green-700">
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="bg-red-105 p-1.5 rounded-full text-red-705">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-805 dark:text-slate-300 max-w-[140px] truncate">{tx.description}</p>
                      <p className="text-[9px] text-muted-foreground">
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
