// A template (unlike a layout) is re-created on every navigation, so the page content fades in
// each time while the sidebar and header around it stay put.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="tp-page">{children}</div>;
}
