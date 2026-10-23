import primary from "./assets/ci/yk-ci-korean-primary.svg";
import white from "./assets/ci/yk-ci-korean-white.svg";

import bilingualPrimary from "./assets/ci/yk-ci-bilingual-primary.svg";
import bilingualWhite from "./assets/ci/yk-ci-bilingual-white.svg";

export default function Logo({ className = "ci", bilingual = false }) {
  return (
    <span className={`${className} official-ci`} role="img" aria-label="법무법인 YK">
      <img className="ci-primary" src={bilingual ? bilingualPrimary : primary} alt="" aria-hidden="true" />
      <img className="ci-white" src={bilingual ? bilingualWhite : white} alt="" aria-hidden="true" />
    </span>
  );
}
