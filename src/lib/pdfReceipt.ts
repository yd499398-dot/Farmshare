import { jsPDF } from 'jspdf';

export interface RentalReceiptData {
  id: string;
  equipment: {
    id: number | string;
    name: string;
    category: string;
    price: number;
    location: string;
    owner: string;
    description?: string;
  };
  startDate: string;
  endDate: string;
  totalCost: number;
  status: 'pending' | 'accepted' | 'active' | 'completed' | 'declined' | 'cancelled';
  renterName: string;
  renterPhone?: string;
  renterEmail?: string;
  currency?: 'INR' | 'USD';
  exchangeRate?: number;
  bookingDate?: string;
}

export function generateRentalReceiptPDF(data: RentalReceiptData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currencySymbol = data.currency === 'USD' ? '$' : 'Rs.';
  const displayTotal = data.currency === 'USD' && data.exchangeRate
    ? Math.round(data.totalCost / (data.exchangeRate > 1 ? data.exchangeRate : 83))
    : data.totalCost;
  
  const dailyRate = data.currency === 'USD' && data.exchangeRate
    ? Math.round(data.equipment.price / (data.exchangeRate > 1 ? data.exchangeRate : 83))
    : data.equipment.price;

  // Header Banner
  doc.setFillColor(21, 128, 61); // emerald-700
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent Line
  doc.setFillColor(234, 179, 8); // yellow-500
  doc.rect(0, 38, pageWidth, 2.5, 'F');

  // Title & Brand
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('AGRISHARE COMMUNITY', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Official Farm Machinery Rental Agreement & Tax Receipt', 14, 25);
  doc.text('Secure Farmer-to-Farmer Equipment Sharing Platform', 14, 31);

  // Status Badge on Top Right
  const isAcceptedOrCompleted = data.status === 'accepted' || data.status === 'active' || data.status === 'completed';
  const badgeText = isAcceptedOrCompleted ? 'CONFIRMED & ACCEPTED' : 'PENDING APPROVAL';
  
  doc.setFillColor(isAcceptedOrCompleted ? 220 : 254, isAcceptedOrCompleted ? 252 : 243, isAcceptedOrCompleted ? 231 : 199);
  doc.roundedRect(pageWidth - 68, 12, 54, 14, 2, 2, 'F');
  doc.setTextColor(isAcceptedOrCompleted ? 22 : 180, isAcceptedOrCompleted ? 101 : 83, isAcceptedOrCompleted ? 52 : 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(badgeText, pageWidth - 41, 20.5, { align: 'center' });

  // Receipt Meta Info Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 46, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RECEIPT NUMBER', 20, 54);
  doc.text('BOOKING DATE', 75, 54);
  doc.text('RENTAL STATUS', 130, 54);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const cleanReceiptNum = `AGRI-${data.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;
  doc.text(cleanReceiptNum, 20, 62);
  doc.text(data.bookingDate || new Date().toISOString().split('T')[0], 75, 62);
  doc.text(data.status.toUpperCase(), 130, 62);

  // Section 1: Equipment Details
  let currentY = 80;
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. MACHINERY SPECIFICATIONS', 14, currentY);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY + 3, pageWidth - 14, currentY + 3);

  currentY += 11;
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Equipment Name:', 18, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.equipment.name, 60, currentY);

  currentY += 7;
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Category:', 18, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.equipment.category, 60, currentY);

  currentY += 7;
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Location / Dispatch:', 18, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.equipment.location, 60, currentY);

  currentY += 7;
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Machinery Owner:', 18, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.equipment.owner, 60, currentY);

  // Section 2: Parties Information
  currentY += 14;
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. RENTER & OWNER DETAILS', 14, currentY);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY + 3, pageWidth - 14, currentY + 3);

  // Two columns for Renter and Owner
  currentY += 11;
  const col1X = 18;
  const col2X = pageWidth / 2 + 6;

  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Renter (Tenant Farmer)', col1X, currentY);
  doc.text('Machinery Provider (Owner)', col2X, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${data.renterName || 'Farmer'}`, col1X, currentY);
  doc.text(`Name: ${data.equipment.owner}`, col2X, currentY);

  currentY += 5.5;
  doc.text(`Contact: ${data.renterPhone || 'Phone Registered on Platform'}`, col1X, currentY);
  doc.text(`Location: ${data.equipment.location}`, col2X, currentY);

  currentY += 5.5;
  doc.text(`Email: ${data.renterEmail || 'N/A'}`, col1X, currentY);
  doc.text(`Platform Status: Verified Owner`, col2X, currentY);

  // Section 3: Rental Schedule & Itemized Bill
  currentY += 14;
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. RENTAL PERIOD & FINANCIAL BREAKDOWN', 14, currentY);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY + 3, pageWidth - 14, currentY + 3);

  currentY += 10;
  // Calculate days
  const startMs = new Date(data.startDate).getTime();
  const endMs = new Date(data.endDate).getTime();
  const diffDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, pageWidth - 28, 7, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DESCRIPTION', 18, currentY + 4.8);
  doc.text('PERIOD / RATE', 110, currentY + 4.8);
  doc.text('AMOUNT', pageWidth - 20, currentY + 4.8, { align: 'right' });

  currentY += 9;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.text(`Machinery Hire: ${data.equipment.name}`, 18, currentY);
  doc.text(`${diffDays} day(s) @ ${currencySymbol} ${dailyRate.toLocaleString()}/day`, 110, currentY);
  doc.text(`${currencySymbol} ${displayTotal.toLocaleString()}`, pageWidth - 20, currentY, { align: 'right' });

  currentY += 7;
  doc.text('Community Damage Protection Shield', 18, currentY);
  doc.text('Included by AgriShare', 110, currentY);
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.text('FREE', pageWidth - 20, currentY, { align: 'right' });

  currentY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text('On-site Field Pickup & Inspection Guarantee', 18, currentY);
  doc.text('Included', 110, currentY);
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.text('FREE', pageWidth - 20, currentY, { align: 'right' });

  currentY += 5;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, currentY, pageWidth - 14, currentY);

  currentY += 7;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL AMOUNT PAID / PAYABLE:', 18, currentY);
  doc.setTextColor(21, 128, 61);
  doc.setFontSize(13);
  doc.text(`${currencySymbol} ${displayTotal.toLocaleString()}`, pageWidth - 20, currentY, { align: 'right' });

  // Verification Seal Box
  currentY += 15;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, currentY, pageWidth - 28, 32, 3, 3, 'FD');

  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('AGRISHARE VERIFIED FARMER TRANSACTION', 20, currentY + 8);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('• Rental dates: ' + data.startDate + ' to ' + data.endDate + ' (' + diffDays + ' calendar days).', 20, currentY + 14);
  doc.text('• Equipment must be operated safely and returned in the same condition as received.', 20, currentY + 19);
  doc.text('• In case of emergency assistance, contact your local AgriShare community representative.', 20, currentY + 24);

  // Footer
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.text('AgriShare Community Platform • Rural Equipment Access for Every Farmer • Generated on ' + new Date().toLocaleString(), pageWidth / 2, 287, { align: 'center' });

  // Save the PDF
  doc.save(`AgriShare_Receipt_${data.id}.pdf`);
}
