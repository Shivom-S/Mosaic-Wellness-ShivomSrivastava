import { WORRY, type WorryId } from "@/content";

export type Route =
  | { name: "home" }
  | { name: "about" }
  | { name: "check" | "result" | "track" | "example"; id: WorryId };

export const href = (r: Route) => {
  switch (r.name) {
    case "home":
      return "#/";
    case "about":
      return "#/about";
    default:
      return `#/${r.name}/${r.id}`;
  }
};

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [name, id] = parts;
  if (name === "about") return { name: "about" };
  if ((name === "check" || name === "result" || name === "track" || name === "example") && id && id in WORRY) {
    return { name, id: id as WorryId };
  }
  return { name: "home" };
}

/** Swap the current history entry instead of adding one (so Back doesn't bounce). */
export function replaceRoute(r: Route) {
  const url = window.location.pathname + window.location.search + href(r);
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export const routeKey = (r: Route) => (r.name === "home" || r.name === "about" ? r.name : `${r.name}/${r.id}`);
