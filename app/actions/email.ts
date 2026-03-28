/**
 * email.ts
 * 
 * Server actions for sending emails.
 * Uses the Resend service to send digital receipts to clients.
 */
"use server";

import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { jsx } from 'react/jsx-runtime';
import { ReceiptEmail } from "@/components/emails/ReceiptEmail";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a digital receipt email using the Resend service.
 * 
 * Process:
 * 1. Reads the company logo from the local filesystem to include as an inline attachment.
 * 2. Renders the 'ReceiptEmail' React template as the email body.
 * 3. Sends the email via Resend's API.
 * 
 * @param data - The receipt details to be displayed in the email.
 * @param data.folio - The Work Order folio number.
 * @param data.fecha - The formatted date of the service.
 * @param data.cliente - The full name of the client.
 * @param data.concepto - A description of the service performed.
 * @param data.total - The total amount in pesos.
 * @param data.deposito - The deposit amount in pesos.
 * @param data.balance - The remaining balance (total - deposit).
 * @param data.balanceDueDate - Optional due date for the balance.
 * @param data.formaPago - The payment method (Efectivo, Transferencia).
 * @param data.recibio - The name of the person who received the payment.
 * @param data.email - The destination email address.
 * 
 * @returns An object indicating success and containing the Resend response data, or a failure message.
 */
export async function sendReceiptEmail(data: {
  folio: string;
  fecha: string;
  cliente: string;
  concepto: string;
  total: number;
  deposito: number;
  balance: number;
  balanceDueDate?: string;
  formaPago: string;
  recibio: string;
  email: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized: Only admins can send payment receipts." };
    }

    const { folio, fecha, cliente, concepto, total, deposito, balance, balanceDueDate, formaPago, recibio, email } = data;

    console.log(`[EmailAction] Starting send to: ${email}`);
    console.log(`[EmailAction] API Key present: ${!!process.env.RESEND_API_KEY}`);

    const logoRelPath = "public/Bayside_PV_Logo.jpg";
    const logoPath = path.join(process.cwd(), logoRelPath);
    let attachments: any[] = [];
    
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      attachments.push({
        content: logoBuffer,
        filename: 'Bayside_PV_Logo.jpg',
        contentId: 'logo-image',
      });
      console.log(`[EmailAction] Logo attached. Size: ${logoBuffer.length} bytes.`);
    } else {
      console.warn("[EmailAction] Logo not found at:", logoPath);
    }

    console.log(`[EmailAction] Attempting to send email via Resend...`);

    const response = await resend.emails.send({
      from: "Bayside PV <contact@bayside.jacobshome.com>", 
      to: [email],
      bcc: "apexcrossfitgym@gmail.com",
      subject: `Nota de Pago Bayside PV - Folio: ${folio}`,
      attachments,
      react: jsx(ReceiptEmail, {
        folio,
        fecha,
        cliente,
        concepto,
        total,
        deposito,
        balance,
        balanceDueDate,
        formaPago,
        recibio
      })
    });

    if (response.error) {
      console.error("[EmailAction] Resend API Error:", JSON.stringify(response.error, null, 2));
      return { success: false, error: `${response.error.name}: ${response.error.message}` };
    }

    console.log("[EmailAction] Email sent successfully! ID:", response.data?.id);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("[EmailAction] Exception:", error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}
