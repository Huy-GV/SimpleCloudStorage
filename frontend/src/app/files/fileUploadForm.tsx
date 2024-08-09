import { ChangeEvent, useState } from 'react';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UploadFileFormProps } from "./models";
import { uploadFile } from '../../api/fileApis';

export function FileUploadForm(
	{
		onFileUploaded,
		onErrorSet,
		parentDirectoryId
	} : UploadFileFormProps
) {
	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || !e.target.files[0]) {
			return;
		}

		const fileToUpload = e.target.files[0]
		if (!fileToUpload) {
			onErrorSet({
				message: "No file selected",
				statusCode: 'unknown'
			});
			return;
		}

		const result = await uploadFile(fileToUpload, parentDirectoryId);
		if (!result.rawResponse?.ok ) {
			onErrorSet({
				message: result.message,
				statusCode: result.rawResponse?.status.toString() ?? 'unknown'
			});
			
			return;
		}

		onErrorSet(null);
		await onFileUploaded();
	}

	return (
		<form encType='multipart/form-data' className='w-full sm:w-fit'>
			{
				<>
					<label
						htmlFor='file'
						className='bg-blue-700 text-white p-3 border-none rounded-md text-base block hover:cursor-pointer shadow-md hover:shadow-lg text-center'>
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
