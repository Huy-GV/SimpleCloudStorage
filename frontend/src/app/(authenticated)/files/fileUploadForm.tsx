import { ChangeEvent } from 'react';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type FileUploadFormProps = {
	onFileUploaded: (fileLists: FileList) => Promise<void>;
}

export default function FileUploadForm({
	onFileUploaded,
} : FileUploadFormProps) {
	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || !e.target.files[0]) {
			return;
		}

		await onFileUploaded(e.target.files);
	}

	return (
		<form encType='multipart/form-data' className='w-full sm:w-fit'>
			{
				<>
					<label
						htmlFor='file'
						className='bg-blue-700 text-white p-3 border-none rounded-md text-base block hover:cursor-pointer shadow-md hover:bg-blue-900 text-center transition-all duration-00'>
						<FontAwesomeIcon icon={faUpload} />
						<span className='ml-2'>
							Upload
						</span>
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
