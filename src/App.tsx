import "./App.css";
import "./assets/styles/global.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import ToastHandlerContextProvider from "@contexts/ToastHandlerContext";
import Layout from "@components/layout/Layout";

function App() {
  return (
    <Router>
      <ToastHandlerContextProvider>
        <Routes>
          <Route path="/" element={<Layout children={<Home />} />} />
        </Routes>
      </ToastHandlerContextProvider>
    </Router>
  );
}

export default App;
