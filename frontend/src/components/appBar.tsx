"use client"

import styles  from './appBar.module.css'
import { useRouter } from "next/navigation";

export default function AppBar() {
    const router = useRouter();

    const handleSignOut = async () => {
        // http only cookies are controlled set by the server
        await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/sign-out`,
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        router.push('/auth')
    }

    return (
        <nav className={styles.navContainer}>
            <button className={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>
        </nav>
    )
}
