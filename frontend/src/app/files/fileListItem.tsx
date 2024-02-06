import styles from './files.module.css'
import { FileItemData } from './page';

export function FileListItem({ name }: FileItemData) {
    return (
        <div className={styles.singleFileContainer}>
            <p className={styles.fileAttribute}>File Name: { name }</p>
            <p className={styles.fileAttribute}>Upload Date: unimplemented</p>
            <button className={styles.deleteFileBtn}>Delete</button>
        </div>
    );
}
