import { NextResponse } from "next/server";
import { getWallbitClient } from "@/lib/wallbit";

/**
 * GET /api/wallbit?userId=xxx — Saldo de billetera
 * POST /api/wallbit — Pago de emergencia
 * Dev 2: Endpoints Wallbit
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 });
  }

  try {
    const client = getWallbitClient();
    const balance = await client.getBalance(userId);
    const transactions = await client.getTransactions(userId);

    return NextResponse.json({ balance, transactions });
  } catch (error) {
    console.error("[API /wallbit GET]", error);
    return NextResponse.json({ error: "Error al consultar billetera" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = getWallbitClient();
    const result = await client.processEmergencyPayment(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /wallbit POST]", error);
    return NextResponse.json({ error: "Error en pago de emergencia" }, { status: 500 });
  }
}
