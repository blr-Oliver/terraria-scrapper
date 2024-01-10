export interface PrefixIdInfo {
  id: number;
  name: string;
  note?: string;
}

export function parsePrefixIdsFromDoc(document: Document): PrefixIdInfo[] {
  let table = document.querySelector('table.terraria.sortable')! as HTMLTableElement;
  return [...table.rows].slice(1)
      .map(row => {
        let result = {
          id: +row.cells[0].textContent!
        } as PrefixIdInfo;
        let nameCell = row.cells[1];
        nameCell.normalize();
        result.name = nameCell.childNodes[0].textContent!.trim();
        let note = nameCell.querySelector('.note-text');
        if (note)
          result.note = note.textContent!.trim();
        return result;
      });
}