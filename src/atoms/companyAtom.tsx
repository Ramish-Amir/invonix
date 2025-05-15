import { atom } from "jotai";

const companyLocalstorageValue = atom(localStorage.getItem("companyId"));

// Create the atom with persistence
export const companyIdAtom = atom(
  (get) => get(companyLocalstorageValue),
  (get, set, newCompanyId: string) => {
    set(companyLocalstorageValue, newCompanyId);
    localStorage.setItem("companyId", newCompanyId);
  }
);
