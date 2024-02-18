import { ChangeEvent, useState } from 'react';
import { FileItemData as FileItemProps } from './definitions';
import styles from './files.module.css'
import { JWT_STORAGE_KEY } from '../constants';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

export function FileListItem(
	{
		id,
		name,
		selected,
		uploadDate,
		size,
		isDirectory,
		parentDirectoryId,
		onDirectoryClicked,
		onFileSelect,
		onFileNameChanged
	} : FileItemProps
) {
	const router = useRouter();
	const [isEditFormDisplayed, setIsEditFormDisplayed] = useState<boolean>(false);
	const [newName, setNewName] = useState<string>(name);

	const localDate = `${uploadDate.getDate()}/${uploadDate.getMonth()}/${uploadDate.getFullYear()} ${uploadDate.getHours()}:${uploadDate.getMinutes()}`;

	const getFileTypeText = (isDirectory: boolean) => {
		return isDirectory ? 'Folder' : 'File'
	}

	const getFileSizeText = (sizeKb: number) => {
		if (isDirectory || Number.isNaN(size)) {
			return '-'
		}

		if (sizeKb < 1) {
			return '<1 KB'
		}

		if (sizeKb <= 1024) {
			return `${Math.round(sizeKb)} KB`
		}

		// 1048576 = 1024 * 1024
		if (sizeKb > 1024 && sizeKb < 1048576) {
			return `${Math.round(sizeKb / 1024)} MB`
		}

		return `${Math.round(sizeKb / 1048576)} GB`
	}

	const handleFileSelect = () => {
		onFileSelect();
	}

	const handleFileNameClick = () => {
		setIsEditFormDisplayed(true);
	}

	const handleNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
		setNewName(e.target.value)
	}

	const handleNameChangeSubmitted = async (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			setIsEditFormDisplayed(false);
			e.preventDefault();
			return;
		}

		if (e.key !== 'Enter') {
			return;
		}

		e.preventDefault();
		setIsEditFormDisplayed(false);

		const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/files/update-name`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${localStorage[JWT_STORAGE_KEY]}`
			},
			body: JSON.stringify({
				id: id,
				newFileName: newName,
				parentDirectoryId: parentDirectoryId
			})
		})

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				router.push('/auth');
				return;
			}

			return;
		}

		onFileNameChanged();
	}

	const handleFileClicked = (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
		e.preventDefault();
		if (isDirectory) {
			onDirectoryClicked()
		}
	}

	const handleNameInputFocusLost = () => {
		setIsEditFormDisplayed(false);
	}

	return (
		<tr className={selected ? styles.selectedRow : ''} onDoubleClick={handleFileClicked}>
			<td>
				<input
					type='checkbox'
					className={styles.fileCheckbox}
					onChange={handleFileSelect}
					checked={selected}>
				</input>
			</td>
			<td className={styles.alignLeftCol}>
				{
					isEditFormDisplayed
						?
						<>
							<input
								className={styles.changeNameInput}
								type='text'
								value={newName}
								autoFocus
								onBlur={handleNameInputFocusLost}
								onChange={handleNameChanged}
								onKeyDown={handleNameChangeSubmitted}></input>
						</>
						:
						<div className={styles.fileNameContainer}>
							<span>
								{name}
							</span>
							<button
								className={styles.editFileNameBtn}
								onClick={handleFileNameClick}
							>
								<FontAwesomeIcon icon={faPenToSquare}></FontAwesomeIcon>
								Edit
							</button>
						</div>

				}
			</td>
			<td className={styles.alignLeftCol}>{ getFileSizeText(size) }</td>
			<td className={styles.alignLeftCol}>{ getFileTypeText(isDirectory) }</td>
			<td className={styles.alignRightCol}>{ localDate }</td>
		</tr>
	);
}
