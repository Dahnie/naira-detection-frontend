import { useState, useEffect, useRef, useLayoutEffect } from "react";
import styles from "./WarningHandler.module.css";
import { ToastHandlerType } from "@models/ToastHandlerTypes";
import cancelIcon from "@assets/images/svg/cancel-icon.svg";
import errorCancelIcon from "@assets/images/svg/warning-icon.svg";
import { AnimatePresence, motion } from "framer-motion";

interface IProps {
  warningHandlerObj: ToastHandlerType;
  className?: string;
}

const WarningHandler = function ({ warningHandlerObj, className }: IProps) {
  // Functions, States and Variables
  // Ref
  const toastHandlerRef = useRef<HTMLDivElement | null>(null);
  // States
  const [show, setShow] = useState(false);
  const [toastHandlerOffsetWidth, setToastHandlerOffsetWidth] = useState(0);

  // Functions
  // Handle Set Toast Offset Width
  const handleSetToastHandlerOffsetWidth = function () {
    if (toastHandlerRef.current) {
      setToastHandlerOffsetWidth(toastHandlerRef.current.offsetWidth / 2);
    }
  };

  // UseEffect
  useLayoutEffect(() => {
    if (show) {
      // Set the offset width of the error handler on screen resize
      window.addEventListener("resize", handleSetToastHandlerOffsetWidth);

      handleSetToastHandlerOffsetWidth();
      return () => {
        window.removeEventListener("resize", handleSetToastHandlerOffsetWidth);
      };
    }
  }, [show]);

  useEffect(() => {
    setShow(false);
    if (warningHandlerObj.show) setShow(true);
  }, [warningHandlerObj]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={toastHandlerRef}
          className={`${styles.toast_handler_container} ${className}`}
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -80 }}
          style={{ left: `calc(50vw - ${toastHandlerOffsetWidth}px)` }}
        >
          <div className={styles.toast_handler_header}>
            {/* Left Column */}
            <div className={styles.toast__left_col}>
              <div className={styles.error_icon_wrapper}>
                <img src={errorCancelIcon} alt="erorr icon" />
              </div>
              <div className={styles.toast_handler_title}>
                {warningHandlerObj.message}
              </div>
            </div>

            {/* Right Column */}
            <div className={styles.cancel_button_wrapper}>
              <button onClick={() => setShow(false)}>
                <img src={cancelIcon} alt="cancel icon" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WarningHandler;
