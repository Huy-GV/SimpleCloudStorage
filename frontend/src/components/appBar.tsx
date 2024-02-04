import Link from "next/link";

import styles  from './appBar.module.css'

const AuthenticationButton = () => {
    const isSignedIn: boolean = false;
    const authenticationLinkLabel: string = isSignedIn ? "Sign Out" : "Sign In"

    const handleSignOut = () => {

    }

    return isSignedIn
        ? (<button onClick={handleSignOut}>{authenticationLinkLabel}</button>)
        : (<Link href="/auth">{authenticationLinkLabel}</Link>)
}

export default function AppBar() {

    return (
        <nav className={styles.navContainer}>
            <AuthenticationButton></AuthenticationButton>
            <Link href="/files">My Files</Link>
        </nav>
    )
}
