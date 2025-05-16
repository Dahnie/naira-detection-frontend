import { useState, useEffect } from "react";
import { ArrowLeft, Volume2, RefreshCw } from "lucide-react";
import styles from "./Result.module.css";

interface ResultProps {
  imageUrl: string;
  denomination: string | null;
  confidence: number;
  onBack: () => void;
  onNewScan: () => void;
  onSpeak: () => void;
}

const Result: React.FC<ResultProps> = ({
  imageUrl,
  denomination,
  confidence,
  onBack,
  onNewScan,
  onSpeak,
}) => {
  const [confidenceLevel, setConfidenceLevel] = useState<
    "high" | "medium" | "low"
  >("low");

  // Determine confidence level color
  useEffect(() => {
    if (confidence > 0.85) {
      setConfidenceLevel("high");
    } else if (confidence > 0.6) {
      setConfidenceLevel("medium");
    } else {
      setConfidenceLevel("low");
    }
  }, [confidence]);

  return (
    <div className={styles.resultContainer}>
      <div className={styles.resultHeader}>
        <button
          className={styles.backButton}
          onClick={onBack}
          aria-label="Back to Camera"
        >
          <ArrowLeft size={24} />
        </button>
        <h2>Detection Result</h2>
      </div>

      <div className={styles.resultContent}>
        <div className={styles.resultImageContainer}>
          <img
            src={imageUrl}
            alt="Detected Naira Note"
            className={styles.resultImage}
          />
        </div>

        <div className={styles.resultInfo}>
          <h3 className={styles.denominationText}>
            {denomination || "No Naira note detected"}
          </h3>

          {denomination && (
            <div className={styles.confidenceContainer}>
              <div className={styles.confidenceBarContainer}>
                <div
                  className={`${styles.confidenceBar} ${styles[confidenceLevel]}`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <p className={styles.confidenceText}>
                {`${Math.round(confidence * 100)}% Confidence`}
              </p>
            </div>
          )}
        </div>

        <div className={styles.resultActions}>
          <button
            className={styles.actionButton}
            onClick={onSpeak}
            aria-label="Speak Result"
          >
            <Volume2 size={20} />
            <span>Speak Result</span>
          </button>

          <button
            className={styles.actionButton}
            onClick={onNewScan}
            aria-label="New Scan"
          >
            <RefreshCw size={20} />
            <span>New Scan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Result;
