import { lazy, startTransition, Suspense, useEffect, useRef, useState } from "react";
import { WORRY } from "@/content";
import { Toaster } from "@/components/ui/sonner";
import { Shell } from "@/components/Shell";
import { UrgentHelp } from "@/components/UrgentHelp";
import { parseHash, routeKey, type Route } from "@/lib/route";
import { useTheme } from "@/lib/theme";
import { Check } from "@/screens/Check";
import { Home } from "@/screens/Home";
import { Result } from "@/screens/Result";

// Secondary screens load on demand so the home screen's JS stays small. Result and Check stay eager.
const About = lazy(() => import("@/screens/About").then((m) => ({ default: m.About })));
const Example = lazy(() => import("@/screens/Example").then((m) => ({ default: m.Example })));
const Track = lazy(() => import("@/screens/Track").then((m) => ({ default: m.Track })));
const AiCheck = lazy(() => import("@/screens/AiCheck").then((m) => ({ default: m.AiCheck })));
const AiResult = lazy(() => import("@/screens/AiResult").then((m) => ({ default: m.AiResult })));

const titleFor = (r: Route) => {
  switch (r.name) {
    case "home":
      return "1AM: honest answers to 1 AM health worries";
    case "about":
      return "Why I built this · 1AM";
    case "ai-check":
      return "Your check · 1AM";
    case "ai-result":
      return "Your answer · 1AM";
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
    case "ai-check":
      return <AiCheck />;
    case "ai-result":
      return <AiResult />;
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
  const { theme, setTheme, comfort, setComfort } = useTheme();
  const first = useRef(true);

  // Hash is the source of truth: Back, shared links and in-app <a href="#/…"> all land here.
  useEffect(() => {
    // a transition keeps the current screen up while a lazy one loads, instead of flashing a fallback
    const onHash = () => startTransition(() => setRoute(parseHash(window.location.hash)));
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
        onTheme={setTheme}
        comfort={comfort}
        onComfort={setComfort}
        onHome={route.name === "home"}
        stars={route.name === "home" ? "full" : "sides"}
        footer={route.name !== "check" && route.name !== "ai-check"}
      >
        <div key={key}>
          <Suspense fallback={<div aria-hidden="true" className="min-h-[50dvh]" />}>
            <Screen route={route} />
          </Suspense>
        </div>
      </Shell>
      <UrgentHelp />
      <Toaster theme={theme === "lamp" ? "light" : "dark"} />
    </>
  );
}
