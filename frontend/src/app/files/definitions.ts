export interface FileItemData {
    id: number,
    name: string,
    selected: boolean,
    onFileSelect: () => void
    onFileNameChanged: () => void
    // uploadDate: Date
}
