import SubmoduleBar from "@/components/layout/SubmoduleBar";

export default function Module1Layout({ children }: LayoutProps<"/module-1">) {
  return (
    <>
      <SubmoduleBar />
      {children}
    </>
  );
}
