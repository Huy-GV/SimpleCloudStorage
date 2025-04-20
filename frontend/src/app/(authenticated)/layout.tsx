import Link from "next/link";

export default function Layout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <>
        <nav className="flex flex-row justify-end py-4 px-7 mb-4 shadow-sm border-b border-gray-100 bg-white">
            <span className="mr-auto text-lg font-semibold tracking-wide text-blue-600">SimpleCloud</span>
            <Link href='/auth/sign-out' className='bg-none border-none text-base'>Sign Out</Link>
        </nav>
        {children}
      </>
    );
  }
