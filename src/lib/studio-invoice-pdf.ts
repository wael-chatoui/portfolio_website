import { jsPDF } from 'jspdf';
import { displayCents, lineTotal, linesForDraft, linesTotal } from './studio-invoice-lines';

const formatDate = (value?: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : 'À renseigner';
const supplied = (value?: string) => value || 'À renseigner';

/** Create a selectable, paginated PDF from the current draft and an embedded font. */
export function createInvoicePdf(data: Record<string, string>, font: Uint8Array): ArrayBuffer {
  const lines = linesForDraft(data);
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  let binary = '';
  for (let i = 0; i < font.length; i += 8192) binary += String.fromCharCode(...font.subarray(i, i + 8192));
  doc.addFileToVFS('NotoSans.ttf', btoa(binary));
  doc.addFont('NotoSans.ttf', 'NotoSans', 'normal');
  doc.setFont('NotoSans');
  doc.setProperties({ title: `Brouillon de facture ${data.invoiceNumber || ''}`.trim() });
  const width = doc.internal.pageSize.getWidth(); const height = doc.internal.pageSize.getHeight();
  const left = 46; const right = width - left; const contentWidth = right - left;
  const ink = '#243022'; const muted = '#65745f'; const lineColor = '#cbd2c7';
  let y = 55;
  const smallHeading = (label: string, x: number, yy: number, align: 'left' | 'right' = 'left') => { doc.setFontSize(9); doc.setTextColor(muted); doc.text(label.toUpperCase(), x, yy, { align }); };
  const rule = (yy: number) => { doc.setDrawColor(lineColor); doc.line(left, yy, right, yy); };
  const ensure = (space: number) => { if (y + space > height - 66) { doc.addPage(); y = 56; } };
  const wrapped = (value: string, x: number, yy: number, maxWidth: number, size = 10) => {
    doc.setFontSize(size); doc.setTextColor(ink);
    const parts: string[] = doc.splitTextToSize(value, maxWidth);
    doc.text(parts, x, yy, { lineHeightFactor: 1.35 });
    return yy + parts.length * size * 1.35;
  };
  smallHeading('Document de travail', left, y);
  doc.setTextColor(ink); doc.setFontSize(22); doc.text('Brouillon de facture', left, y + 28);
  doc.setFontSize(10); doc.setTextColor(muted); doc.text('BROUILLON', right, y + 5, { align: 'right' });
  if (data.invoiceNumber) { doc.setFontSize(11); doc.setTextColor(ink); doc.text(`N° ${data.invoiceNumber}`, right, y + 27, { align: 'right' }); }
  y += 50; rule(y); y += 26;
  const columnWidth = (contentWidth - 28) / 2;
  smallHeading('De', left, y); smallHeading('À', left + columnWidth + 28, y);
  const seller = [supplied(data.seller), supplied(data.sellerAddress), data.sellerSiret ? `SIRET : ${data.sellerSiret}` : data.siren ? `SIREN : ${data.siren}` : 'SIRET à renseigner'].join('\n');
  const client = [supplied(data.client), supplied(data.clientAddress), data.clientSiret ? `SIRET : ${data.clientSiret}` : data.clientSiren ? `SIREN : ${data.clientSiren}` : 'SIRET à renseigner'].join('\n');
  const y1 = wrapped(seller, left, y + 18, columnWidth); let y2 = wrapped(client, left + columnWidth + 28, y + 18, columnWidth);
  if (data.clientWarning || data.clientAddressSource === 'registered') y2 = wrapped('Coordonnées de facturation à vérifier.', left + columnWidth + 28, y2 + 7, columnWidth, 9);
  y = Math.max(y1, y2) + 25;
  const cols = [left + contentWidth * .57, left + contentWidth * .72, left + contentWidth * .86, right];
  const header = () => { smallHeading('Prestation', left, y); smallHeading('Qté', cols[1] - 10, y, 'right'); smallHeading('Prix', cols[2] - 10, y, 'right'); smallHeading('Total', right, y, 'right'); y += 11; rule(y); y += 17; };
  ensure(80); header();
  for (const line of lines) {
    doc.setFontSize(10);
    const name: string[] = doc.splitTextToSize(line.name, contentWidth * .53);
    doc.setFontSize(9);
    const description: string[] = line.description ? doc.splitTextToSize(line.description, contentWidth * .53) : [];
    const rowHeight = Math.max(28, name.length * 14 + description.length * 12 + 16);
    if (y + rowHeight > height - 66) { doc.addPage(); y = 56; header(); }
    doc.setFontSize(10); doc.setTextColor(ink); doc.text(name, left, y, { lineHeightFactor: 1.4 });
    if (description.length) { doc.setFontSize(9); doc.setTextColor(muted); doc.text(description, left, y + name.length * 14, { lineHeightFactor: 1.33 }); }
    doc.setFontSize(9); doc.setTextColor(ink);
    doc.text(line.quantity, cols[1] - 10, y, { align: 'right' });
    doc.text(displayCents(lineTotal({ ...line, quantity: '1' })), cols[2] - 10, y, { align: 'right' });
    doc.text(displayCents(lineTotal(line)), right, y, { align: 'right' });
    y += rowHeight; rule(y - 5); y += 10;
  }
  ensure(180); y += 15; doc.setFontSize(14); doc.setTextColor(ink); doc.text('Total', left, y); doc.text(displayCents(linesTotal(lines)), right, y, { align: 'right' });
  y += 34; smallHeading('Date de prestation', left, y); smallHeading('Échéance', left + columnWidth + 28, y);
  doc.setFontSize(10); doc.setTextColor(ink); doc.text(formatDate(data.serviceDate), left, y + 18); doc.text(formatDate(data.dueDate), left + columnWidth + 28, y + 18);
  y += 48; rule(y); y += 24; smallHeading('Paiement par virement bancaire', left, y);
  y = wrapped(`IBAN : ${supplied(data.iban)}`, left, y + 18, contentWidth, 10);
  wrapped('Merci de votre confiance', left, y + 18, contentWidth, 10);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFontSize(8); doc.setTextColor(muted);
    doc.text('Brouillon de travail, document non émis.', left, height - 34);
    doc.text(`${page} / ${pages}`, right, height - 34, { align: 'right' });
  }
  return doc.output('arraybuffer');
}

export async function downloadInvoicePdf(data: Record<string, string>): Promise<void> {
  const response = await fetch('/fonts/noto-sans-regular.ttf');
  if (!response.ok) throw new Error('Police indisponible');
  const bytes = createInvoicePdf(data, new Uint8Array(await response.arrayBuffer()));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const link = document.createElement('a'); link.href = url; link.download = `brouillon-${data.invoiceNumber || 'facture'}.pdf`;
  document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
