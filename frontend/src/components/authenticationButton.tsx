"use client"

import Link from "next/link";
import styles  from './appBar.module.css'
import { JWT_STORAGE_KEY } from "@/app/constants";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthenticationButton () {
    const router = useRouter();
    const [isSignedIn, setSignedIn] = useState<boolean>(localStorage[JWT_STORAGE_KEY])

    const handleSignOut = () => {
        if (isSignedIn) {
            localStorage.removeItem(JWT_STORAGE_KEY);
            setSignedIn(false);
            router.push('/files')
        }
    }

    return isSignedIn
        ? (<button className={styles.signOutBtn} onClick={handleSignOut}>Sign Out</button>)
        : (<Link href="/auth">Sign In</Link>)
}
