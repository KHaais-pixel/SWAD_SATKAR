import { Bodoni_Moda, Cormorant_Garamond, Karla, Space_Mono } from "next/font/google";

/** The four faces from the design: Bodoni for headlines, Cormorant for the italic lines, Karla for text, Space Mono for labels. */
export const bodoni = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-bodoni", display: "swap" });
export const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
export const karla = Karla({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-karla", display: "swap" });
export const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono", display: "swap" });
