import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

/**
 * Properties for the ReceiptEmail component.
 */
interface ReceiptEmailProps {
  /** The unique folio identifier for the payment. */
  folio: string;
  /** The date the payment was recorded or the service provided. */
  fecha: string;
  /** The full name of the client. */
  cliente: string;
  /** A description of the service or product purchased. */
  concepto: string;
  /** The total amount in pesos. */
  total: number;
  /** The deposit amount in pesos. */
  deposito: number;
  /** The remaining balance (total - deposit). */
  balance: number;
  /** Optional due date for the balance. */
  balanceDueDate?: string;
  /** The method of payment used (Efectivo, Transferencia). */
  formaPago: string;
  /** The name of the employee or system entity that processed the payment. */
  recibio: string;
}

/**
 * ReceiptEmail Component
 * 
 * A React Email template designed to render a professional, mobile-responsive
 * digital receipt for Bayside PV customers.
 * 
 * Features:
 * - Brand-aligned header with logo and sub-heading.
 * - Organized service and financial details section.
 * - Clear distinction of the final payment amount.
 * - Signature line for transparency.
 * - Inline styling compatible with most major email clients.
 * 
 * @param props - Component properties (see ReceiptEmailProps)
 */
export const ReceiptEmail: React.FC<ReceiptEmailProps> = ({
  folio,
  fecha,
  cliente,
  concepto,
  total,
  deposito,
  balance,
  balanceDueDate,
  formaPago,
  recibio,
}) => (
  <Html>
    <Head />
    <Preview>Nota de Pago Bayside PV - Folio: {folio}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img
            src="cid:logo-image"
            alt="Bayside PV Logo"
            width="210"
            style={logo}
          />
          <Text style={subHeading}>Water Taxi & Tours</Text>
          <Text style={documentType}>NOTA DE PAGO</Text>
        </Section>

        <Section style={detailsSection}>
          <Row>
            <Column align="left">
              <Text style={detailText}><strong>Folio:</strong> {folio}</Text>
            </Column>
            <Column align="right">
              <Text style={detailText}><strong>Fecha:</strong> {fecha}</Text>
            </Column>
          </Row>
        </Section>

        <Section style={clientSection}>
          <Text style={clientBox}><strong>Cliente:</strong> {cliente}</Text>
        </Section>

        <Section style={serviceSection}>
          <Heading as="h3" style={sectionTitle}>Detalles del Servicio</Heading>
          <Text style={serviceDetails}>{concepto}</Text>
        </Section>

        <Hr style={divider} />

        <Section style={financialSection}>
          <Row style={financialRow}>
            <Column align="left"><Text style={financialLabel}>Total:</Text></Column>
            <Column align="right"><Text style={financialValue}>${total} MXN</Text></Column>
          </Row>
          <Row style={financialRow}>
            <Column align="left"><Text style={financialLabel}>Depósito:</Text></Column>
            <Column align="right"><Text style={financialValue}>${deposito} MXN</Text></Column>
          </Row>
          <Row style={financialRow}>
            <Column align="left"><Text style={financialLabel}>Saldo:</Text></Column>
            <Column align="right"><Text style={pagoFinalValue}>${balance} MXN</Text></Column>
          </Row>
          {balanceDueDate && (
            <Row style={financialRow}>
              <Column align="left"><Text style={financialLabel}>Fecha de vencimiento del saldo:</Text></Column>
              <Column align="right"><Text style={financialValue}>{balanceDueDate}</Text></Column>
            </Row>
          )}
          <Row style={financialRow}>
            <Column align="left"><Text style={financialLabel}>Forma de Pago:</Text></Column>
            <Column align="right"><Text style={financialValue}>{formaPago}</Text></Column>
          </Row>
        </Section>

        <Section style={signatureSection}>
          <Hr style={dashedDivider} />
          <Text style={signatureText}><strong>Recibió:</strong> {recibio}</Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Nota de Pago Digital • BAYSIDE PV • Puerto Vallarta, MX
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ReceiptEmail;

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: 'sans-serif',
  padding: '20px 0',
};

const container = {
  margin: '0 auto',
  padding: '0',
  width: '600px',
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  overflow: 'hidden',
};

const headerSection = {
  padding: '30px 20px 20px 20px',
  borderBottom: '2px solid #f1f5f9',
  textAlign: 'center' as const,
};

const logo = {
  display: 'block',
  margin: '0 auto 15px auto',
};

const subHeading = {
  margin: '5px 0 0 0',
  color: '#2563eb',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
};

const documentType = {
  margin: '15px 0 0 0',
  color: '#64748b',
  fontFamily: 'monospace',
  fontSize: '12px',
  fontWeight: 'bold',
};

const detailsSection = {
  padding: '20px 40px',
};

const detailText = {
  fontSize: '14px',
  color: '#475569',
  margin: '0',
};

const clientSection = {
  padding: '0 40px 20px 40px',
};

const clientBox = {
  padding: '15px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #f1f5f9',
  fontSize: '16px',
  color: '#1e293b',
  margin: '0',
};

const serviceSection = {
  padding: '0 40px 20px 40px',
};

const sectionTitle = {
  margin: '0 0 10px 0',
  fontSize: '14px',
  color: '#1e3a8a',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const serviceDetails = {
  fontSize: '15px',
  color: '#334155',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
  margin: '0',
};

const divider = {
  borderColor: '#f1f5f9',
  margin: '0 40px',
};

const financialSection = {
  padding: '20px 40px 30px 40px',
};

const financialRow = {
  margin: '5px 0',
};

const financialLabel = {
  fontSize: '14px',
  color: '#64748b',
  margin: '0',
};

const financialValue = {
  fontSize: '14px',
  color: '#1e293b',
  fontWeight: '600',
  margin: '0',
};

const pagoFinalValue = {
  fontSize: '18px',
  color: '#1e3a8a',
  fontWeight: '800',
  margin: '0',
};

const signatureSection = {
  padding: '0 40px 30px 40px',
};

const dashedDivider = {
  borderTop: '1px dashed #cbd5e1',
  margin: '0 0 20px 0',
};

const signatureText = {
  fontSize: '14px',
  color: '#475569',
  margin: '0',
};

const footer = {
  padding: '20px',
  backgroundColor: '#f1f5f9',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '11px',
  color: '#94a3b8',
  margin: '0',
};
