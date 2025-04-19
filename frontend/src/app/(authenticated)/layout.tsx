import AppBar from "@components/appBar";

export default function Layout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <>
        <AppBar />
        {children}
      </>
    );
  }
