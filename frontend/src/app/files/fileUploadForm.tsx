import { ChangeEvent, useState } from "react";
import { JWT_STORAGE_KEY } from "../constants";
import { useRouter } from "next/navigation";
import styles from "./files.module.css"
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UploadFileFormProps } from "./definitions";

export function FileUploadForm(
	{
		onFileUploaded,
		parentDirectoryId
	} : UploadFileFormProps
) {
	const router = useRouter();
	const [error, setError] = useState<string>('');

	const uploadFile = async (fileToUpload: File) => {
		if (!fileToUpload) {
			setError('No file selected')
			return;
		}

		const formData = new FormData();
		formData.append('file', fileToUpload);
		formData.append('directoryFileId', JSON.stringify(parentDirectoryId));

		const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/files/upload`, {
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

		setError('')
	}

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || !e.target.files[0]) {
			return;
		}

		await uploadFile(e.target.files[0]);
		await onFileUploaded();
	}

	return (
		<form encType='multipart/form-data'>
			{
				<>
					<label
						htmlFor='file'
						className='bg-blue-700 text-white p-3 border-none rounded-md text-base block hover:cursor-pointer shadow-md hover:shadow-lg'>
						<FontAwesomeIcon icon={faUpload} />
						<span className='ml-2'>Upload</span>
					</label>
					<input
						id='file'
						type='file'
						className='hidden'
						name='file'
						onChange={handleFileChange} />
				</>
			}
		</form>
	);
}
