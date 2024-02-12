import { ChangeEvent, FormEvent, useState } from "react"
import styles from "./auth.module.css"
import { JWT_STORAGE_KEY, SERVER_URL } from "../constants";
import { useRouter } from "next/navigation";

export default function SignUpForm() {

	const router = useRouter();
    const [error, setError] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [email, setEmail] = useState<string>('');

    const handleUserNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserName(e.target.value)
    }

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
    }

    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value)
    }

    const signUp = async () => {
        const requestBody = {
            userName,
            password,
            email,
        };

        try {
            const response = await fetch(
                `${SERVER_URL}/auth/sign-up`,
                {
                    body: JSON.stringify(requestBody),
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                })

            if (!response.ok) {
                console.error('Failed to sign up: ', response.statusText)
                setError("Incorrect credentials");
                return;
            }

            const jwtDto = await response.json();
            localStorage.setItem(JWT_STORAGE_KEY, jwtDto.token)
			console.log('Successfully signed up');
			router.push('/files')
        } catch (e) {
            console.log('Failed to sign up: ', e)
            setError("An unknown error occurred");
        }
    }

    const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await signUp();
    }

    return (
        <>
            <h1>Sign Up</h1>
            {
                error &&
                <div>
                    Sign Up Error: {error}
                </div>
            }
            <form className={styles.authForm} onSubmit={handleSignUp}>
                <label htmlFor="userName">User Name</label>
                <input
                    type="text"
                    id="userName"
                    name="userName"
                    value={userName}
                    onChange={handleUserNameChange}
                    required
                />

                <label htmlFor="email">Email</label>
                <input
                    type="text"
                    id="email"
                    name="email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                />

                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                />

                <button type="submit" className={styles.signUpBtn}>Sign Up</button>
            </form>
    </>
    )
  }
