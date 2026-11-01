import { RoutineMenu } from "./components/menu_components/menu";
import { DashBoard } from "./components/dashboard-components/dashboard";
import "./App.css";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionPhase, setTransitionPhase] = useState("entering");

  useEffect(() => {
    if (location.key === displayLocation.key) return undefined;

    let swapTimeoutId;
    const exitTimeoutId = window.setTimeout(() => {
      setTransitionPhase("exiting");
      swapTimeoutId = window.setTimeout(() => {
        setDisplayLocation(location);
        setTransitionPhase("entering");
      }, 160);
    }, 0);

    return () => {
      window.clearTimeout(exitTimeoutId);
      window.clearTimeout(swapTimeoutId);
    };
  }, [location, displayLocation]);

  return (
    <div className={`app-route-transition is-${transitionPhase}`}>
      <Routes location={displayLocation}>
        <Route path="/" element={<RoutineMenu />} />
        <Route path="/dashboard" element={<DashBoard />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;

