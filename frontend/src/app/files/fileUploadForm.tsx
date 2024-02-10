import { ChangeEvent, FormEvent, useState } from "react";
import { JWT_STORAGE_KEY, SERVER_URL } from "../constants";
import { useRouter } from "next/navigation";
import styles from "./files.module.css"

export function FileUploadForm({ onFileUploaded }: { onFileUploaded: () => Promise<void> }) {
    const router = useRouter();
    const [error, setError] = useState<string>('');

    const uploadFile = async (fileToUpload: File) => {
        if (!fileToUpload) {
            setError('No file selected')
            return;
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);

        const response = await fetch(`${SERVER_URL}/files/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage[JWT_STORAGE_KEY]}`
            },
            body: formData
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                router.push('/auth');
                return;
            }

            setError('Failed to upload file')
            return;
        }
    }

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) {
            return;
        }

        await uploadFile(e.target.files[0]);
        await onFileUploaded();
    }

    return (
        <div>
            {
                error && <p>Error: {error}</p>
            }
            <form className={styles.uploadForm} encType="multipart/form-data">
                {
                    <>
                        <label htmlFor="file" className={styles.selectFileToUploadBtn}>Upload File</label>
                        <input id='file' type="file"
                            className={styles.fileInput}
                            name="file"
                            onChange={handleFileChange} />
                    </>
                }
            </form>

        </div>
    );
}
