export interface FileItemData {
    id: number,
    name: string,
    selected: boolean,
    onFileSelect: () => void
    // uploadDate: Date
}
