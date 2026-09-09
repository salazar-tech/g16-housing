const DRIVE_FOLDER_ID = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_DRIVE';
const TEMPLATE_DOCUMENT_ID = 'PEGA_AQUI_EL_ID_DEL_DOCUMENTO_PLANTILLA';

const LANDLORD = {
  name: 'REEMPLAZAR EN APPS SCRIPT',
  nationality: 'REEMPLAZAR EN APPS SCRIPT',
  dni: 'REEMPLAZAR EN APPS SCRIPT',
  address: 'REEMPLAZAR EN APPS SCRIPT',
  email: 'REEMPLAZAR EN APPS SCRIPT',
  phone: 'REEMPLAZAR EN APPS SCRIPT'
};

function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        data = {};
      }
    }

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const fileName = generateFileName(data);
    
    const copiedFile = DriveApp
      .getFileById(TEMPLATE_DOCUMENT_ID)
      .makeCopy(fileName, folder);
      
    const document = DocumentApp.openById(copiedFile.getId());
    const values = buildTemplateValues(data);

    replaceTokensInBody(document.getBody(), values);
    if (document.getHeader()) replaceTokensInBody(document.getHeader(), values);
    if (document.getFooter()) replaceTokensInBody(document.getFooter(), values);
    
    document.saveAndClose();

    return jsonResponse({
      ok: true,
      fileId: copiedFile.getId(),
      fileUrl: copiedFile.getUrl()
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message
    });
  }
}

function doGet() {
  return jsonResponse({
    ok: true,
    message: 'Google Apps Script activo.'
  });
}

function generateFileName(data) {
  const guestName = (data.guest && data.guest.name) ? data.guest.name : 'guest';
  const formattedDate = getFormattedDate(data);
  const rawFileName = `G16Housing - ${formattedDate} - ${guestName}`;

  return sanitizeFileName(rawFileName);
}

function getFormattedDate(data) {
  const contract = data.contract || {};
  
  // Parse contract.startDate (expected format: DD/MM/YYYY or DD-MM-YYYY)
  if (contract.startDate) {
    const parts = contract.startDate.split(/[\/\.-]/);
    if (parts.length === 3) {
      const dd = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      const yy = parts[2].slice(-2);
      return `${mm}${dd}${yy}`;
    }
  }

  // Fallback to today's date if contract.startDate is missing or malformed
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const yy = String(today.getFullYear()).slice(-2);
  return `${mm}${dd}${yy}`;
}

function buildTemplateValues(data) {
  const guest = data.guest || {};
  const contract = data.contract || {};

  return {
    '{{landlordName}}': LANDLORD.name,
    '{{landlordNationality}}': LANDLORD.nationality,
    '{{landlordDni}}': LANDLORD.dni,
    '{{landlordAddress}}': LANDLORD.address,
    '{{landlordEmail}}': LANDLORD.email,
    '{{landlordPhone}}': LANDLORD.phone,
    '{{dateDay}}': contract.day,
    '{{dateMonth}}': contract.month,
    '{{dateYear}}': contract.year,
    '{{guestName}}': guest.name,
    '{{guestNationality}}': guest.nationality,
    '{{guestDni}}': guest.dni,
    '{{guestAddress}}': guest.address,
    '{{guestEmail}}': guest.email,
    '{{guestPhone}}': guest.phone,
    '{{startDate}}': contract.startDate,
    '{{endDate}}': contract.endDate,
    '{{rentWords}}': contract.rentWords,
    '{{rentAmount}}': contract.rentAmount,
    '{{paymentDay}}': contract.paymentDay,
    '{{depositWords}}': contract.depositWords,
    '{{depositAmount}}': contract.depositAmount
  };
}

function replaceTokensInBody(container, values) {
  Object.keys(values).forEach(function(token) {
    const replacement = values[token] == null ? '' : String(values[token]);
    const pattern = token.replace(/[{}]/g, '\\$&');
    container.replaceText(pattern, replacement);
  });
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[\\/:*?"<>|]/g, '-');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}