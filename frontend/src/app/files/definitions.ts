export interface FileItemData {
    id: number,
    name: string,
    size: number,
    selected: boolean,
    uploadDate: Date
    onFileSelect: () => void
    onFileNameChanged: () => void
}
