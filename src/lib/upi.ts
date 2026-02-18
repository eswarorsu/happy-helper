
import QRCode from 'qrcode';

export interface UPIDetails {
    pa: string; // Payee Address (VPA)
    pn: string; // Payee Name
    am?: string; // Transaction Amount
    cu?: string; // Currency Code (default INR)
    tn?: string; // Transaction Note
}

export const generateUPIString = ({ pa, pn, am, cu = 'INR', tn }: UPIDetails): string => {
    let url = `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&cu=${cu}`;

    if (am) {
        url += `&am=${am}`;
    }

    if (tn) {
        url += `&tn=${encodeURIComponent(tn)}`;
    }

    return url;
};

export const generateQRCode = async (text: string): Promise<string> => {
    try {
        return await QRCode.toDataURL(text, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        });
    } catch (err) {
        console.error('Error generating QR code', err);
        return '';
    }
};
