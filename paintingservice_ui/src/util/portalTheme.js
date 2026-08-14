export const portalCard = {
  light: "bg-white border border-slate-200/70 shadow-sm",
  dark: "bg-slate-800/60 border border-slate-700/60 shadow-lg shadow-black/20",
};

export const portalText = {
  light: { title: "text-slate-800", muted: "text-slate-500", body: "text-slate-600" },
  dark: { title: "text-slate-100", muted: "text-slate-400", body: "text-slate-300" },
};

export function getPortalVariant(theme) {
  return theme === "dark" ? "dark" : "light";
}
