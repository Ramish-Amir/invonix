import { atom } from "jotai";

// export const authAtom: any = atom(false);

const auth = atom(localStorage.getItem("auth"));

// Create the atom with persistence
export const authAtom = atom(
  (get) => get(auth) || null,
  (get, set, newAuth: string | null) => {
    set(auth, newAuth);
    if (auth) {
      localStorage.setItem("auth", newAuth || "");
    } else {
      localStorage.removeItem("auth");
    }
  }
);
