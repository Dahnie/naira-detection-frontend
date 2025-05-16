import React from "react";
import styles from "./Loading.module.css";
import type { LoadingProps } from "../../models/Types";

/**
 * Loading indicator component
 */
const Loading: React.FC<LoadingProps> = ({
  isLoading,
  message = "Processing Image...",
}) => {
  if (!isLoading) return null;

  return (
    <div className={styles.loadingIndicator} role="alert" aria-busy="true">
      <div className={styles.spinner} aria-hidden="true"></div>
      <p>{message}</p>
    </div>
  );
};

export default Loading;
