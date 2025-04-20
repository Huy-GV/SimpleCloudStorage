import { sleep } from "@/utilities";
import { useRouter } from "next/navigation";

export default function useSignOutAfterDelay() {
    const router = useRouter();
    const signOutAfterDelay = (statusCode: string, timeoutMs = 1500) => {
        if (statusCode === '401' ||statusCode === '403') {
            sleep(timeoutMs).then(() => router.push('/auth/sign-out'));
        }
    }

    return signOutAfterDelay

}
