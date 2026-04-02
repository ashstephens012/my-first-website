import PortalNav from "@/components/PortalNav";

export const metadata = {
  title: "Member Portal | The Invisible Orthodontist",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PortalNav />
      {children}
    </>
  );
}
