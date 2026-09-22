import logo from "./logo.svg?raw";

export default function Logo({ className = "ci" }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: logo }} />;
}
