import { toString as qrCodeToString } from "qrcode";

/** SVG for the jar-table printout. Generated locally so the marina can print offline. */
export async function lineGuessQrSvg(url: string): Promise<string> {
  const svg = await qrCodeToString(url, {
    type: "svg",
    margin: 1,
    width: 280,
    errorCorrectionLevel: "M",
    color: { dark: "#16354fff", light: "#f6ecd6ff" },
  });
  if (!svg.startsWith("<svg") || svg.includes("<script")) {
    throw new Error("QR SVG was not usable");
  }
  return svg;
}
