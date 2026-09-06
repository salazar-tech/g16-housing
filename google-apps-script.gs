const DRIVE_FOLDER_ID = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_DRIVE';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!data.pdfBase64) {
      throw new Error('No se recibio ningun PDF.');
    }

    const fileName = sanitizeFileName(data.fileName || 'contrato-hospedaje.pdf');
    const pdfBytes = Utilities.base64Decode(data.pdfBase64);
    const pdfBlob = Utilities.newBlob(pdfBytes, MimeType.PDF, fileName);
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const file = folder.createFile(pdfBlob);

    return jsonResponse({
      ok: true,
      fileId: file.getId(),
      fileUrl: file.getUrl()
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message
    });
  }
}

function doGet() {
  return jsonResponse({ ok: true, message: 'Google Apps Script activo.' });
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[\\/:*?"<>|]/g, '-');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
