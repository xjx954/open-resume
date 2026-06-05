import { getSupportedImportFileType } from '../fileTextExtractor';

function fileWithName(name: string): File {
  return { name } as File;
}

describe('getSupportedImportFileType', () => {
  it('detects supported import file extensions', () => {
    expect(getSupportedImportFileType(fileWithName('resume.md'))).toBe('markdown');
    expect(getSupportedImportFileType(fileWithName('resume.markdown'))).toBe('markdown');
    expect(getSupportedImportFileType(fileWithName('resume.txt'))).toBe('text');
    expect(getSupportedImportFileType(fileWithName('resume.docx'))).toBe('docx');
    expect(getSupportedImportFileType(fileWithName('resume.pdf'))).toBe('pdf');
  });

  it('rejects unsupported import file extensions', () => {
    expect(getSupportedImportFileType(fileWithName('resume.doc'))).toBeNull();
    expect(getSupportedImportFileType(fileWithName('resume.png'))).toBeNull();
  });
});
