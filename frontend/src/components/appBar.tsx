"use client"

import Link from "next/link";
import styles  from './appBar.module.css'
import AuthenticationButton from "./authenticationButton";

export default function AppBar() {

    return (
        <nav className={styles.navContainer}>
            <AuthenticationButton></AuthenticationButton>
            <Link href="/files">My Files</Link>
        </nav>
    )
}
