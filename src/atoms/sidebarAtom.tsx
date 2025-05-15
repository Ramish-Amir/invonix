import { atom } from "jotai";

// Helper function to get initial state from localStorage or default to true (open)
const getInitialSidebarState = () => {
  if (typeof window !== "undefined") {
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null ? JSON.parse(savedState) : true; // Default to true if no saved state
  }
  return true; // Default value during server-side rendering
};

// Atom to manage sidebar state, with initial value from localStorage
export const sidebarAtom = atom(getInitialSidebarState());

// Atom to toggle the sidebar and persist the value to localStorage
export const toggleSidebarAtom = atom(
  (get) => get(sidebarAtom),
  (get, set) => {
    const newState = !get(sidebarAtom);
    set(sidebarAtom, newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarOpen", JSON.stringify(newState));
    }
  }
);
