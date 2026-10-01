import { useEffect, useRef, useState } from "react";
import { WORRY } from "@/content";
import { Toaster } from "@/components/ui/sonner";
import { Shell } from "@/components/Shell";
import { parseHash, routeKey, type Route } from "@/lib/route";
import { useTheme } from "@/lib/theme";
import { About } from "@/screens/About";
import { Check } from "@/screens/Check";
import { Example } from "@/screens/Example";
import { Home } from "@/screens/Home";
import { Result } from "@/screens/Result";
import { Track } from "@/screens/Track";

const titleFor = (r: Route) => {
  switch (r.name) {
    case "home":
      return "1AM: honest answers to 1 AM health worries";
    case "about":
      return "Why I built this · 1AM";
    default:
      return `${WORRY[r.id].title} · 1AM`;
  }
};

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case "home":
      return <Home />;
    case "about":
      return <About />;
    case "check":
      return <Check id={route.id} />;
    case "result":
      return <Result id={route.id} />;
    case "track":
      return <Track id={route.id} />;
    case "example":
      return <Example id={route.id} />;
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const { theme, toggle } = useTheme();
  const first = useRef(true);

  // Hash is the source of truth: Back, shared links and in-app <a href="#/…"> all land here.
  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const key = routeKey(route);
  useEffect(() => {
    document.title = titleFor(route);
    window.scrollTo(0, 0);
    // move focus to the new screen (skipped on first load so we don't steal the page's start)
    if (!first.current) document.getElementById("main")?.focus({ preventScroll: true });
    first.current = false;
  }, [key]); // keyed on the route's identity, not the object

  return (
    <>
      <Shell
        theme={theme}
        onToggleTheme={toggle}
        stars={route.name === "home" ? "full" : "sides"}
        footer={route.name !== "check"}
      >
        <div key={key}>
          <Screen route={route} />
        </div>
      </Shell>
      <Toaster theme={theme === "lamp" ? "light" : "dark"} />
    </>
  );
}
