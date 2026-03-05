"use server";

import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { jsx } from 'react/jsx-runtime';
import { ReceiptEmail } from "@/components/emails/ReceiptEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReceiptEmail(data: {
  folio: string;
  fecha: string;
  cliente: string;
  concepto: string;
  balance: number;
  pagoFinal: number;
  formaPago: string;
  recibio: string;
  email: string;
}) {
  try {
    const { folio, fecha, cliente, concepto, balance, pagoFinal, formaPago, recibio, email } = data;

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
      subject: `Nota de Pago Bayside PV - Folio: ${folio}`,
      attachments,
      react: jsx(ReceiptEmail, {
        folio,
        fecha,
        cliente,
        concepto,
        balance,
        pagoFinal,
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
