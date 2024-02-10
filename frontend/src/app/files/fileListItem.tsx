import { FileItemData } from './definitions';
import styles from './files.module.css'
export function FileListItem({ name, onFileSelect }: FileItemData) {
    const handleFileSelect = () => {
        onFileSelect();
    }

    return (
        <tr>
            <td><input type='checkbox' className={styles.fileCheckbox} onChange={handleFileSelect}></input></td>
            <td className={styles.nameCol}>{ name }</td>
            <td className={styles.uploadDateCol}>unimplemented</td>
        </tr>
    );
}
