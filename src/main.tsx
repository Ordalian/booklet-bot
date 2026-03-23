import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const storedTheme = window.localStorage.getItem("booklet-theme");
const useDarkTheme = storedTheme ? storedTheme === "dark" : true;
document.documentElement.classList.toggle("dark", useDarkTheme);

createRoot(document.getElementById("root")!).render(<App />);
