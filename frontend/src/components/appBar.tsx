"use client"

import styles  from './appBar.module.css'
import { JWT_STORAGE_KEY } from "@/app/constants";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppBar() {
    const router = useRouter();
    const [isSignedIn, setSignedIn] = useState<boolean>(false)

    useEffect(() => {
        setSignedIn(localStorage[JWT_STORAGE_KEY])
    }, [])

    const handleSignOut = () => {
        if (isSignedIn) {
            localStorage.removeItem(JWT_STORAGE_KEY);
            setSignedIn(false);
            router.push('/auth')
        }
    }

    return (
        <nav className={styles.navContainer}>
            <button className={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>
        </nav>
    )
}
