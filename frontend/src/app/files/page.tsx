"use client"
import { useEffect, useState } from "react"
import { JWT_STORAGE_KEY, SERVER_URL } from "../constants";
import { FileListItem } from "./fileListItem";
import { useRouter } from "next/navigation";
import { FileUploadForm } from "./fileUploadForm";
import styles from './files.module.css'

export interface FileItemData {
  name: string,
  // uploadDate: Date
}

export default function Page() {
  const router = useRouter();

  const [fileItemList, setFileItemList] = useState<FileItemData[]>([]);
  const [error, setError] = useState<string>('');

  const fetchAllFiles = async function(): Promise<FileItemData[] | null> {
    const response = await fetch(`${SERVER_URL}/files/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage[JWT_STORAGE_KEY]}`
      }
    });

    if (!response.ok) {
      setError("Failed to fetch files");

      if (response.status === 401 || response.status === 403) {
        router.push('/auth');
      }

      return null;
    }

    const files: FileItemData[] = await response.json();
    return files;
  }

  useEffect(() => {
    fetchAllFiles().then((files) => {
      return files && setFileItemList(files);
    })
  }, [])

    return (
      <main className={styles.fileListContainer}>
        <FileUploadForm></FileUploadForm>
        {
          error && <p>Error: {error}</p>
        }
        {
          fileItemList.map((item, index) => (
            <FileListItem
              key={index}
              name={item.name}
              // uploadDate={item.uploadDate}
            >
            </FileListItem>
          ))
        }
      </main>
    )
  }
