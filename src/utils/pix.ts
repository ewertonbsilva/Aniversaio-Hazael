/**
 * Pix Copy and Paste (BR Code) Generator
 * Adheres strictly to the guidelines of the Central Bank of Brazil (BCB).
 */

interface GeneratePixParams {
  pixKey: string;
  amount?: number;
  receiverName: string;
  receiverCity: string;
  txId?: string;
}

/**
 * Removes accents and special characters to ensure full compatibility with EMV readers.
 */
export function removeAccents(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^\w\s@.-]/g, "") // remove special chars except common pix key characters
    .trim();
}

/**
 * Calculates CRC16 CCITT-FALSE (polynomial: 0x1021, initial value: 0xFFFF)
 */
export function calculateCRC16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Generates a valid and secure PIX payload string.
 */
export function generatePixPayload({
  pixKey,
  amount,
  receiverName,
  receiverCity,
  txId = "HAZAEL1ANO"
}: GeneratePixParams): string {
  function formatField(id: string, value: string): string {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
  }

  // Standardize values
  const normalizedKey = pixKey.trim();
  const cleanName = removeAccents(receiverName).toUpperCase().substring(0, 25);
  const cleanCity = removeAccents(receiverCity).toUpperCase().substring(0, 15);
  // txId can only contain alphanumeric characters
  const cleanTxId = removeAccents(txId)
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .substring(0, 25) || "HAZAEL1ANO";

  // GUI + KEY subfields for merchant details block (ID 26)
  const gui = "br.gov.bcb.pix";
  const merchantAccountInfo = formatField("00", gui) + formatField("01", normalizedKey);

  let payload = "";
  payload += formatField("00", "01"); // Payload Format Indicator
  payload += formatField("26", merchantAccountInfo); // Merchant Account
  payload += formatField("52", "0000"); // Merchant Category Code
  payload += formatField("53", "986"); // Currency: BRL (986)

  if (amount && amount > 0) {
    payload += formatField("54", amount.toFixed(2)); // Transaction Amount
  }

  payload += formatField("58", "BR"); // Country Code
  payload += formatField("59", cleanName); // Merchant Name (Beneficiary)
  payload += formatField("60", cleanCity); // Merchant City
  
  // Field 62 (Additional Data Field Template)
  const additionalData = formatField("05", cleanTxId);
  payload += formatField("62", additionalData);

  // Field 63 (CRC Template & Checksum)
  payload += "6304";
  const checksum = calculateCRC16(payload);
  
  return payload + checksum;
}
