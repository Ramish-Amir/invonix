import { atom } from "jotai";

export interface CompanyInfo {
  id: string;
  name: string;
}

// Atom to store the user's company information
export const userCompanyAtom = atom<CompanyInfo | null>(null);
