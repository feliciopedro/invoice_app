import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { Decimal } from '@prisma/client/runtime/library';

interface PdfInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: Decimal;
  total: Decimal;
}

interface PdfInvoiceClient {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
}

interface PdfInvoiceUser {
  name: string;
  email: string;
  businessName: string | null;
  businessAddress: string | null;
  logoUrl: string | null;
}

interface PdfInvoice {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  subtotal: Decimal;
  taxRate: Decimal;
  taxAmount: Decimal;
  discount: Decimal;
  total: Decimal;
  currency: string;
  notes: string | null;
  items: PdfInvoiceItem[];
  client: PdfInvoiceClient;
  user: PdfInvoiceUser;
}

export class PdfService {
  /**
   * Generates a PDF buffer for an invoice
   */
  static async generateInvoicePdfBuffer(invoice: PdfInvoice): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // --- 1. HEADER SECTION ---
      let logoDrawn = false;
      const logoYStart = 50;

      // Handle user business logo if present
      if (invoice.user.logoUrl) {
        try {
          const relativePath = invoice.user.logoUrl.startsWith('/') 
            ? invoice.user.logoUrl.substring(1) 
            : invoice.user.logoUrl;
          const absoluteLogoPath = path.join(process.cwd(), relativePath);

          if (fs.existsSync(absoluteLogoPath)) {
            doc.image(absoluteLogoPath, 50, logoYStart, { width: 60, height: 60 });
            logoDrawn = true;
          }
        } catch (err) {
          console.error('Failed to draw logo on PDF:', err);
        }
      }

      // Business Info (left side)
      const businessInfoX = logoDrawn ? 125 : 50;
      doc
        .fillColor('#1e293b') // Slate dark
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(invoice.user.businessName || invoice.user.name, businessInfoX, logoYStart);
      
      doc
        .fillColor('#64748b') // Slate medium
        .fontSize(9)
        .font('Helvetica')
        .moveDown(0.3);

      if (invoice.user.businessName) {
        doc.text(`Owner: ${invoice.user.name}`, businessInfoX);
      }
      if (invoice.user.businessAddress) {
        doc.text(invoice.user.businessAddress, businessInfoX);
      }
      doc.text(`Email: ${invoice.user.email}`, businessInfoX);

      // Invoice metadata (right side)
      doc
        .fillColor('#3b82f6') // Vibrant blue
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('INVOICE', 350, logoYStart, { align: 'right' });

      doc
        .fillColor('#1e293b')
        .fontSize(10)
        .font('Helvetica-Bold')
        .moveDown(0.5);

      const metadataY = doc.y;
      doc.text(`Invoice Number:`, 350, metadataY, { align: 'left', width: 100 });
      doc.font('Helvetica').text(invoice.invoiceNumber, 450, metadataY, { align: 'right', width: 95 });

      doc.font('Helvetica-Bold').text(`Issue Date:`, 350, doc.y + 3, { align: 'left', width: 100 });
      doc.font('Helvetica').text(new Date(invoice.issueDate).toLocaleDateString(), 450, doc.y - 10, { align: 'right', width: 95 });

      doc.font('Helvetica-Bold').text(`Due Date:`, 350, doc.y + 3, { align: 'left', width: 100 });
      doc.font('Helvetica').text(new Date(invoice.dueDate).toLocaleDateString(), 450, doc.y - 10, { align: 'right', width: 95 });

      doc.font('Helvetica-Bold').text(`Status:`, 350, doc.y + 3, { align: 'left', width: 100 });
      doc.font('Helvetica-Bold').fillColor(
        invoice.status === 'PAID' ? '#10b981' : invoice.status === 'OVERDUE' ? '#ef4444' : '#f59e0b'
      ).text(invoice.status, 450, doc.y - 10, { align: 'right', width: 95 });

      doc.moveDown(2.5);

      // --- 2. BILL TO SECTION ---
      const billToY = Math.max(doc.y, 140);
      doc
        .fillColor('#1e293b')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('BILL TO:', 50, billToY);

      doc
        .font('Helvetica')
        .fontSize(11)
        .moveDown(0.4)
        .text(invoice.client.name)
        .fontSize(9)
        .fillColor('#64748b');

      if (invoice.client.address) {
        doc.text(invoice.client.address);
      }
      doc.text(`Email: ${invoice.client.email}`);
      if (invoice.client.phone) {
        doc.text(`Phone: ${invoice.client.phone}`);
      }

      doc.moveDown(2);

      // --- 3. ITEMS TABLE ---
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b');

      const tableHeaderY = doc.y;
      const colDescriptionX = 50;
      const colQtyX = 320;
      const colPriceX = 390;
      const colTotalX = 470;

      // Draw table header columns
      doc.text('Description', colDescriptionX, tableHeaderY);
      doc.text('Qty', colQtyX, tableHeaderY, { width: 50, align: 'right' });
      doc.text('Unit Price', colPriceX, tableHeaderY, { width: 70, align: 'right' });
      doc.text('Total', colTotalX, tableHeaderY, { width: 75, align: 'right' });

      // Header underline
      doc
        .moveTo(50, tableHeaderY + 15)
        .lineTo(545, tableHeaderY + 15)
        .strokeColor('#cbd5e1')
        .lineWidth(1)
        .stroke();

      doc.moveDown(1.2);

      // Table rows
      doc.font('Helvetica');
      for (const item of invoice.items) {
        const itemY = doc.y;
        
        doc.text(item.description, colDescriptionX, itemY, { width: 260 });
        doc.text(String(item.quantity), colQtyX, itemY, { width: 50, align: 'right' });
        doc.text(Number(item.unitPrice).toFixed(2), colPriceX, itemY, { width: 70, align: 'right' });
        doc.text(Number(item.total).toFixed(2), colTotalX, itemY, { width: 75, align: 'right' });

        doc.moveDown(0.8);
      }

      // Divider line after table
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#cbd5e1')
        .stroke();

      doc.moveDown(1);

      // --- 4. SUMMARY / TOTALS ---
      const subtotal = Number(invoice.subtotal);
      const taxRate = Number(invoice.taxRate);
      const taxAmount = Number(invoice.taxAmount);
      const discount = Number(invoice.discount);
      const total = Number(invoice.total);
      const currency = invoice.currency;

      const summaryLabelX = 330;
      const summaryValueX = 470;

      const drawSummaryLine = (label: string, value: string, isBold = false) => {
        const lineY = doc.y;
        doc
          .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor('#1e293b')
          .fontSize(10)
          .text(label, summaryLabelX, lineY, { width: 130, align: 'right' })
          .text(value, summaryValueX, lineY, { width: 75, align: 'right' });
        doc.moveDown(0.8);
      };

      drawSummaryLine('Subtotal:', `${currency} ${subtotal.toFixed(2)}`);
      
      if (taxRate > 0) {
        const taxPercent = (taxRate * 100).toFixed(0);
        drawSummaryLine(`Tax (${taxPercent}%):`, `${currency} ${taxAmount.toFixed(2)}`);
      } else if (taxAmount > 0) {
        drawSummaryLine(`Tax:`, `${currency} ${taxAmount.toFixed(2)}`);
      }

      if (discount > 0) {
        drawSummaryLine('Discount:', `- ${currency} ${discount.toFixed(2)}`);
      }

      // Draw line above grand total
      doc
        .moveTo(380, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#cbd5e1')
        .stroke();
      doc.moveDown(0.5);

      drawSummaryLine('Grand Total:', `${currency} ${total.toFixed(2)}`, true);

      // --- 5. NOTES AND TERMS ---
      if (invoice.notes) {
        const notesY = doc.y + 15;
        // Keep notes on same page if possible
        if (notesY > 750) {
          doc.addPage();
        }
        
        doc
          .fillColor('#1e293b')
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('Notes / Payment Terms:', 50, doc.y + 10);

        doc
          .fillColor('#475569')
          .font('Helvetica')
          .fontSize(9)
          .moveDown(0.4)
          .text(invoice.notes, 50, doc.y, { width: 495 });
      }

      // Close the PDF document
      doc.end();
    });
  }
}
