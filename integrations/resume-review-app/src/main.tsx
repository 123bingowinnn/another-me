import React from "react";
import { createRoot } from "react-dom/client";
import { ResumeReviewApp } from "../components/ResumeReviewApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ResumeReviewApp />
  </React.StrictMode>,
);
