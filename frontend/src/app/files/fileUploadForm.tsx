import { ChangeEvent, FormEvent, useState } from "react";
import { JWT_STORAGE_KEY, SERVER_URL } from "../constants";
import { useRouter } from "next/navigation";
import styles from "./files.module.css"

export function FileUploadForm() {
    const router = useRouter();
    const [error, setError] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);

    const uploadFile = async () => {

        if (!file) {
            setError('No file selected')
            return;
        }

        const formData = new FormData(); // Create a FormData object to append the file
        formData.append('file', file); // Assuming 'file' is the File object you want to upload

        const response = await fetch(`${SERVER_URL}/files/`, {
            method: 'POST',
            headers: {
                // 'Content-Type': 'application/json',
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

        // TODO: refresh page list
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        uploadFile();
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {

        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            console.log("Changed file")
        }
    }

    return (
        <div>
            {
                error && <p>Error: {error}</p>
            }
            <form className={styles.uploadForm} onSubmit={handleSubmit} encType="multipart/form-data">
                {
                    file
                        ? (<button type="submit" className={styles.uploadFileBtn}>Upload</button>)
                        : (
                            <>
                                <label htmlFor="file" className={styles.selectFileBtn}>Select file</label>
                                <input id='file' type="file"
                                    className={styles.fileInput}
                                    name="file"
                                    onChange={handleFileChange} />
                            </>
                        )
                }
            </form>

        </div>
    );
}
