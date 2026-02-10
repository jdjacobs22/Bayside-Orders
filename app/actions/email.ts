"use server";

import { Resend } from "resend";
import fs from "fs";
import path from "path";

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
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { folio, fecha, cliente, concepto, balance, pagoFinal, formaPago, recibio, email } = data;

    console.log(`[EmailAction] Starting send to: ${email}`);
    console.log(`[EmailAction] API Key present: ${!!process.env.RESEND_API_KEY}`);

    // 1. Check if the logo file exists to avoid crashing
    const logoRelPath = "public/Bayside_PV_Logo.jpg";
    const logoPath = path.join(process.cwd(), logoRelPath);
    
    let attachments = [];
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString("base64");
      attachments.push({
        filename: "Bayside_PV_Logo.jpg",
        content: logoBase64,
        content_id: "logo", // Changed from contentId to content_id
        disposition: "inline",
      } as any);
      console.log("[EmailAction] Logo attached successfully.");
    } else {
      console.warn("[EmailAction] Logo not found at:", logoPath);
    }

    console.log(`[EmailAction] Attempting to send email via Resend...`);

    const response = await resend.emails.send({
      from: "Bayside PV <contact@bayside.jacobshome.com>", 
      to: [email],
      subject: `Nota de Pago Bayside PV - Folio: ${folio}`,
      attachments,
      html: `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-family: sans-serif; background-color: #f8fafc; padding: 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 30px 20px 20px 20px; border-bottom: 2px solid #f1f5f9;">
                    ${attachments.length > 0 ? `
                    <img src="cid:logo" alt="Bayside PV Logo" width="160" height="120" style="display: block; margin-bottom: 15px;" />
                    ` : ""}
                    <h1 style="margin: 0; color: #1e3a8a; font-size: 26px; font-weight: 800; letter-spacing: 0.05em;">BAYSIDE PV</h1>
                    <p style="margin: 5px 0 0 0; color: #2563eb; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Water Taxi & Tours</p>
                    <p style="margin: 15px 0 0 0; color: #64748b; font-family: monospace; font-size: 12px; font-weight: bold;">NOTA DE PAGO</p>
                  </td>
                </tr>

                <!-- Folio and Date Row -->
                <tr>
                  <td style="padding: 20px 40px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left" style="font-size: 14px; color: #475569;">
                          <strong>Folio:</strong> ${folio}
                        </td>
                        <td align="right" style="font-size: 14px; color: #475569;">
                          <strong>Fecha:</strong> ${fecha}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Client Name -->
                <tr>
                  <td style="padding: 0 40px 20px 40px; font-size: 16px; color: #1e293b;">
                    <div style="padding: 15px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;">
                      <strong>Cliente:</strong> ${cliente}
                    </div>
                  </td>
                </tr>

                <!-- Service Details -->
                <tr>
                  <td style="padding: 0 40px 20px 40px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.05em;">Detalles del Servicio</h3>
                    <div style="font-size: 15px; color: #334155; line-height: 1.6; white-space: pre-wrap; min-height: 60px;">${concepto}</div>
                  </td>
                </tr>

                <!-- Financials -->
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                      <tr>
                        <td style="padding: 5px 0; font-size: 14px; color: #64748b;">Balance:</td>
                        <td align="right" style="padding: 5px 0; font-size: 14px; color: #1e293b; font-weight: 600;">$${balance} MXN</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 14px; color: #64748b;">Pago Final:</td>
                        <td align="right" style="padding: 5px 0; font-size: 18px; color: #1e3a8a; font-weight: 800;">$${pagoFinal} MXN</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 14px; color: #64748b;">Forma de Pago:</td>
                        <td align="right" style="padding: 5px 0; font-size: 14px; color: #1e293b;">${formaPago}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Signature -->
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <div style="border-top: 1px dashed #cbd5e1; padding-top: 20px; font-size: 14px; color: #475569;">
                      <strong>Recibió:</strong> ${recibio}
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 20px; background-color: #f1f5f9; font-size: 11px; color: #94a3b8;">
                    Nota de Pago Digital • BAYSIDE PV • Puerto Vallarta, MX
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
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
