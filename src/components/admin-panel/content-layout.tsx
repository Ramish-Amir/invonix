import { Navbar } from "@/components/admin-panel/navbar";

interface ContentLayoutProps {
  title?: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} />
      <div className="container max-w-full min-h-[calc(100vh-57px)] pt-8 pb-8 px-4 sm:px-8">
        {children}
      </div>
    </div>
  );
}
