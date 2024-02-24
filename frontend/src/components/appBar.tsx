import Link from "next/link";

export default function AppBar() {
    return (
        <nav className='flex flex-row ml-2 justify-end pt-6 pr-6'>
            <Link href='/auth' className='bg-none border-none text-base'>Sign Out</Link>
        </nav>
    )
}
