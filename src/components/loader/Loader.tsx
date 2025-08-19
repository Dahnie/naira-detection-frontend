import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import styles from "./Loader.module.css";

function Loader() {
  return (
    <DotLottieReact
      src="https://lottie.host/bf447fcb-b0bb-4a4c-9a83-95a30caf1dda/SwG2iofrcG.lottie"
      loop
      className={styles.loader}
      autoplay
    />
  );
}

export default Loader;
